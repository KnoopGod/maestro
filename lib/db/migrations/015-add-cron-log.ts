import { db } from '../index'

/** Migration 015 — create cron_executions table (idempotent). */
export async function migrateCronLog() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS cron_executions (
      id TEXT PRIMARY KEY,
      job_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'running',
      started_at INTEGER NOT NULL,
      finished_at INTEGER,
      processed_count INTEGER DEFAULT 0,
      results TEXT
    )
  `)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_cron_started ON cron_executions(started_at DESC)`)
}
