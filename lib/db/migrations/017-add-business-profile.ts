import { db } from '../index'

/** Migration 017 — add business profile JSON to clients (idempotent). */
export async function migrateBusinessProfile() {
  const columns = await db.execute(`PRAGMA table_info(clients)`)
  const hasBusinessProfile = columns.rows.some(row => row.name === 'business_profile')
  if (!hasBusinessProfile) {
    await db.execute(`ALTER TABLE clients ADD COLUMN business_profile TEXT`)
  }
}
