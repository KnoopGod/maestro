import { db } from '../index'

export async function migrateClientFinance() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS client_finance_settings (
      client_id TEXT PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
      monthly_retainer REAL DEFAULT 0,
      target_margin_pct REAL DEFAULT 45,
      monthly_api_budget REAL DEFAULT 25,
      monthly_meta_ads_budget REAL DEFAULT 0,
      monthly_google_ads_budget REAL DEFAULT 0,
      planned_posts_per_month INTEGER DEFAULT 12,
      planned_images_per_month INTEGER DEFAULT 12,
      planned_videos_per_month INTEGER DEFAULT 0,
      hourly_internal_rate REAL DEFAULT 35,
      monthly_internal_hours REAL DEFAULT 2,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)
}
