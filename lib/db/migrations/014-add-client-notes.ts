import { db } from '../index'

/** Migration 014 — add internal_notes column to clients table (idempotent). */
export async function migrateClientNotes() {
  const tableInfo = await db.execute(`SELECT sql FROM sqlite_master WHERE type='table' AND name='clients'`)
  const sql = (tableInfo.rows[0] as Record<string, unknown>)?.sql as string | undefined
  if (!sql || /\binternal_notes\b/.test(sql)) return { added: false }
  await db.execute(`ALTER TABLE clients ADD COLUMN internal_notes TEXT`)
  return { added: true }
}
