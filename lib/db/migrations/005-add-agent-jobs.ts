import { db } from '../index'

export async function migrateAgentJobs() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS agent_jobs (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      trigger TEXT NOT NULL DEFAULT 'manual',
      status TEXT NOT NULL DEFAULT 'running',
      brief_summary TEXT,
      post_id TEXT REFERENCES posts(id) ON DELETE SET NULL,
      total_cost REAL DEFAULT 0,
      started_at INTEGER NOT NULL,
      completed_at INTEGER
    )
  `)

  await db.execute(`
    CREATE TABLE IF NOT EXISTS agent_events (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL REFERENCES agent_jobs(id) ON DELETE CASCADE,
      agent TEXT NOT NULL,
      sequence INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      task_label TEXT NOT NULL,
      output_summary TEXT,
      output_data TEXT,
      error_message TEXT,
      error_action TEXT,
      cost REAL DEFAULT 0,
      started_at INTEGER,
      completed_at INTEGER
    )
  `)

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_agent_jobs_client ON agent_jobs(client_id)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_agent_jobs_status ON agent_jobs(status)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_agent_jobs_started ON agent_jobs(started_at)`)
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_agent_events_job ON agent_events(job_id)`)
}
