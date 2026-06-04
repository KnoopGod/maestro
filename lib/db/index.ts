import { createClient } from '@libsql/client'

function cleanEnv(value: string | undefined) {
  if (!value) return undefined
  const trimmed = value.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

const url = cleanEnv(process.env.DATABASE_URL) || 'file:./maestro.db'
const authToken = cleanEnv(process.env.DATABASE_AUTH_TOKEN)

export const db = createClient({
  url,
  authToken,
})

let schemaReady: Promise<void> | null = null
let initializingSchema = false

async function ensureSchema() {
  if (initializingSchema) return

  schemaReady ??= (async () => {
    initializingSchema = true
    try {
      const { initSchema } = await import('./schema')
      await initSchema()
    } finally {
      initializingSchema = false
    }
  })()

  try {
    await schemaReady
  } catch (error) {
    schemaReady = null
    throw error
  }
}

// Auto-init schema on first use (idempotent — uses CREATE TABLE IF NOT EXISTS)
export function getDb() {
  void ensureSchema().catch(() => {
    schemaReady = null
  })
  return db
}

export async function query<T = unknown>(sql: string, args?: unknown[]): Promise<T[]> {
  await ensureSchema()
  const result = await db.execute({ sql, args: args as never })
  return result.rows as unknown as T[]
}

export async function queryOne<T = unknown>(sql: string, args?: unknown[]): Promise<T | null> {
  const rows = await query<T>(sql, args)
  return rows[0] ?? null
}
