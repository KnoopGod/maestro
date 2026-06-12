import { db } from '../index'

export async function migrateClientSummary() {
  await db.execute(`ALTER TABLE clients ADD COLUMN client_summary TEXT`).catch(() => undefined)
}
