import { db } from '../index'

export async function migrateBusinessProfile() {
  await db.execute(`ALTER TABLE clients ADD COLUMN business_profile TEXT`).catch(() => undefined)
}
