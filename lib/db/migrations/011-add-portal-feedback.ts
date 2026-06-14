import { db } from '../index'

export async function migratePortalFeedback() {
  await db.execute(`ALTER TABLE posts ADD COLUMN portal_feedback TEXT`).catch(() => undefined)
}
