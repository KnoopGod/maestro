import { nanoid } from 'nanoid'
import { db, query, queryOne } from '../index'

export type CronJobType = 'publish-due' | 'cleanup-jobs'
export type CronStatus = 'running' | 'completed' | 'failed'

interface CronExecutionRow {
  id: string
  job_type: string
  status: CronStatus
  started_at: number
  finished_at: number | null
  processed_count: number
  results: string | null
}

export interface CronExecution {
  id: string
  jobType: CronJobType
  status: CronStatus
  startedAt: number
  finishedAt: number | null
  processedCount: number
  results: unknown[]
  durationMs: number | null
}

function mapRow(row: CronExecutionRow): CronExecution {
  return {
    id: row.id,
    jobType: row.job_type as CronJobType,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    processedCount: row.processed_count,
    results: row.results ? (() => { try { return JSON.parse(row.results!) } catch { return [] } })() : [],
    durationMs: row.finished_at ? row.finished_at - row.started_at : null,
  }
}

export async function startCronExecution(jobType: CronJobType): Promise<CronExecution> {
  const id = nanoid(12)
  const now = Date.now()
  await db.execute({
    sql: `INSERT INTO cron_executions (id, job_type, status, started_at) VALUES (?, ?, 'running', ?)`,
    args: [id, jobType, now],
  })
  return {
    id, jobType, status: 'running', startedAt: now, finishedAt: null,
    processedCount: 0, results: [], durationMs: null,
  }
}

export async function completeCronExecution(
  id: string,
  opts: { status: CronStatus; processedCount: number; results?: unknown[] }
): Promise<void> {
  const finishedAt = Date.now()
  await db.execute({
    sql: `UPDATE cron_executions SET status = ?, finished_at = ?, processed_count = ?, results = ? WHERE id = ?`,
    args: [
      opts.status,
      finishedAt,
      opts.processedCount,
      JSON.stringify(opts.results ?? []),
      id,
    ],
  })
}

export async function listRecentCronExecutions(limit = 20): Promise<CronExecution[]> {
  const rows = await query<CronExecutionRow>(
    `SELECT * FROM cron_executions ORDER BY started_at DESC LIMIT ?`,
    [limit]
  )
  return rows.map(mapRow)
}

export async function getCronExecution(id: string): Promise<CronExecution | null> {
  const row = await queryOne<CronExecutionRow>(
    `SELECT * FROM cron_executions WHERE id = ?`, [id]
  )
  return row ? mapRow(row) : null
}
