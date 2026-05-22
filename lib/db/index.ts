import { createClient } from '@libsql/client'

const url = process.env.DATABASE_URL || 'file:./maestro.db'
const authToken = process.env.DATABASE_AUTH_TOKEN

export const db = createClient({
  url,
  authToken,
})

// Helper for transactions (single-statement DB ops)
export async function query<T = unknown>(sql: string, args?: unknown[]): Promise<T[]> {
  const result = await db.execute({ sql, args: args as never })
  return result.rows as unknown as T[]
}

export async function queryOne<T = unknown>(sql: string, args?: unknown[]): Promise<T | null> {
  const rows = await query<T>(sql, args)
  return rows[0] ?? null
}
