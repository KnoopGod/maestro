import { createClient } from '@libsql/client'

const url = process.env.DATABASE_URL || 'file:./maestro.db'
const authToken = process.env.DATABASE_AUTH_TOKEN

export const db = createClient({
  url,
  authToken,
})

let schemaReady: Promise<void> | null = null

async function ensureSchema() {
  const { initSchema } = await import('./schema')
  await initSchema()
}

// Auto-init schema on first use (idempotent — uses CREATE TABLE IF NOT EXISTS)
export function getDb() {
  if (!schemaReady) schemaReady = ensureSchema().catch(() => { schemaReady = null })
  return db
}

export async function query<T = unknown>(sql: string, args?: unknown[]): Promise<T[]> {
  if (!schemaReady) schemaReady = ensureSchema().catch(() => { schemaReady = null })
  await schemaReady
  const result = await db.execute({ sql, args: args as never })
  return result.rows as unknown as T[]
}

export async function queryOne<T = unknown>(sql: string, args?: unknown[]): Promise<T | null> {
  const rows = await query<T>(sql, args)
  return rows[0] ?? null
}
