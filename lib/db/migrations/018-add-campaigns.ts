import { db } from '../index'

/** Migration 018 — create campaigns table (idempotent, additive). */
export async function migrateCampaigns() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      name TEXT NOT NULL,
      channel TEXT NOT NULL CHECK(channel IN ('meta_ads', 'google_ads')),
      objective TEXT NOT NULL,
      budget_eur REAL NOT NULL DEFAULT 0,
      start_at INTEGER,
      end_at INTEGER,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'paused', 'completed')),
      brief TEXT NOT NULL DEFAULT '',
      media_plan TEXT,
      results TEXT,
      cost REAL NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_campaigns_client ON campaigns(client_id, created_at DESC)`)
}
