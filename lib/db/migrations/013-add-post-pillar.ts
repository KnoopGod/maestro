import { db } from '../index'

/** Migration 013 — add pillar column to posts table (idempotent). */
export async function migrateAddPostPillar() {
  const tableInfo = await db.execute(`SELECT sql FROM sqlite_master WHERE type='table' AND name='posts'`)
  const sql = (tableInfo.rows[0] as Record<string, unknown>)?.sql as string | undefined
  if (!sql || /\bpillar\b/.test(sql)) return { added: false }
  await db.execute(`ALTER TABLE posts ADD COLUMN pillar TEXT`)
  return { added: true }
}
