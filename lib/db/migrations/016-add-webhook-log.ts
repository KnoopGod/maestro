import { db } from '../index'

/** Migration 016 — create webhook_deliveries table (idempotent). */
export async function migrateWebhookLog() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id TEXT PRIMARY KEY,
      event TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      http_status INTEGER,
      duration_ms INTEGER,
      error TEXT,
      created_at INTEGER NOT NULL
    )
  `)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_webhook_created ON webhook_deliveries(created_at DESC)`)
}
