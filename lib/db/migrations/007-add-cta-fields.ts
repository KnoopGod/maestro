import { db } from '../index'

export async function migrateCTAFields() {
  // cta_type: Facebook CTA button type (e.g. 'BOOK_TRAVEL', 'LEARN_MORE')
  await db.execute(`ALTER TABLE posts ADD COLUMN cta_type TEXT`).catch(() => undefined)
  // cta_url: destination URL for the CTA button
  await db.execute(`ALTER TABLE posts ADD COLUMN cta_url TEXT`).catch(() => undefined)
  // website_url: default booking/website URL per client
  await db.execute(`ALTER TABLE clients ADD COLUMN website_url TEXT`).catch(() => undefined)
}
