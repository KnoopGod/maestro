import { db } from '../index'

interface SqliteMaster { sql: string }

export async function migrateAiStrategy(): Promise<{ added: boolean }> {
  const tableInfo = await db.execute(`SELECT sql FROM sqlite_master WHERE type='table' AND name='clients'`)
  const sql = (tableInfo.rows[0] as unknown as SqliteMaster)?.sql ?? ''
  if (/\bai_strategy\b/.test(sql)) return { added: false }
  await db.execute(`ALTER TABLE clients ADD COLUMN ai_strategy TEXT`)
  return { added: true }
}
