import { db, queryOne } from '../index'

interface SqliteMaster { sql: string | null }

/** Migration 003 — add meta_insights column to posts table (idempotent). */
export async function migratePostInsights(): Promise<{ added: boolean }> {
  const tableInfo = await queryOne<SqliteMaster>(
    `SELECT sql FROM sqlite_master WHERE type='table' AND name='posts'`
  )
  if (!tableInfo?.sql) return { added: false }
  if (/\bmeta_insights\b/.test(tableInfo.sql)) return { added: false }

  await db.execute(`ALTER TABLE posts ADD COLUMN meta_insights TEXT`)
  return { added: true }
}
