import { db } from '../index'
import { nanoid } from 'nanoid'

export type JobStatus = 'running' | 'completed' | 'failed' | 'awaiting_validation'
export type EventStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

export interface AgentJob {
  id: string
  clientId: string
  clientName?: string
  clientEmoji?: string
  trigger: string
  status: JobStatus
  briefSummary: string | null
  postId: string | null
  totalCost: number
  startedAt: number
  completedAt: number | null
  durationMs?: number
  events?: AgentEvent[]
}

export interface AgentEvent {
  id: string
  jobId: string
  agent: string
  sequence: number
  status: EventStatus
  taskLabel: string
  outputSummary: string | null
  outputData: Record<string, unknown> | null
  errorMessage: string | null
  errorAction: string | null
  cost: number
  startedAt: number | null
  completedAt: number | null
  durationMs?: number
}

export interface AgentProductionStats {
  jobs: {
    running: number
    completed: number
    failed: number
    awaitingValidation: number
  }
  events: {
    running: number
    pending: number
    failed: number
  }
  performance: {
    avgDurationMs: number
    avgCost: number
  }
}

function mapJob(row: Record<string, unknown>): AgentJob {
  const startedAt = row.started_at as number
  const completedAt = row.completed_at as number | null
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    clientName: row.client_name as string | undefined,
    clientEmoji: row.client_emoji as string | undefined,
    trigger: row.trigger as string,
    status: row.status as JobStatus,
    briefSummary: row.brief_summary as string | null,
    postId: row.post_id as string | null,
    totalCost: (row.total_cost as number) ?? 0,
    startedAt,
    completedAt,
    durationMs: completedAt ? completedAt - startedAt : undefined,
  }
}

function mapEvent(row: Record<string, unknown>): AgentEvent {
  const startedAt = row.started_at as number | null
  const completedAt = row.completed_at as number | null
  const rawData = row.output_data as string | null
  return {
    id: row.id as string,
    jobId: row.job_id as string,
    agent: row.agent as string,
    sequence: row.sequence as number,
    status: row.status as EventStatus,
    taskLabel: row.task_label as string,
    outputSummary: row.output_summary as string | null,
    outputData: rawData ? (JSON.parse(rawData) as Record<string, unknown>) : null,
    errorMessage: row.error_message as string | null,
    errorAction: row.error_action as string | null,
    cost: (row.cost as number) ?? 0,
    startedAt,
    completedAt,
    durationMs: startedAt && completedAt ? completedAt - startedAt : undefined,
  }
}

// ─── Jobs ──────────────────────────────────────────────────────────────────────

export async function createAgentJob(params: {
  clientId: string
  trigger?: string
  briefSummary?: string
}): Promise<AgentJob> {
  const id = nanoid(12)
  const now = Date.now()
  await db.execute({
    sql: `INSERT INTO agent_jobs (id, client_id, trigger, status, brief_summary, started_at)
          VALUES (?, ?, ?, 'running', ?, ?)`,
    args: [id, params.clientId, params.trigger ?? 'manual', params.briefSummary ?? null, now],
  })
  return {
    id, clientId: params.clientId, trigger: params.trigger ?? 'manual',
    status: 'running', briefSummary: params.briefSummary ?? null,
    postId: null, totalCost: 0, startedAt: now, completedAt: null,
  }
}

export async function completeAgentJob(jobId: string, params: {
  status: JobStatus
  postId?: string
  totalCost?: number
}) {
  const now = Date.now()
  await db.execute({
    sql: `UPDATE agent_jobs SET status = ?, post_id = COALESCE(?, post_id), total_cost = ?, completed_at = ? WHERE id = ?`,
    args: [params.status, params.postId ?? null, params.totalCost ?? 0, now, jobId],
  })
}

export async function listRecentJobs(limit = 30): Promise<AgentJob[]> {
  const result = await db.execute({
    sql: `SELECT j.*, c.name AS client_name, c.emoji AS client_emoji
          FROM agent_jobs j
          LEFT JOIN clients c ON c.id = j.client_id
          ORDER BY j.started_at DESC LIMIT ?`,
    args: [limit],
  })
  return result.rows.map(r => mapJob(r as Record<string, unknown>))
}

export async function listRecentJobsWithEvents(limit = 30): Promise<Array<AgentJob & { events: AgentEvent[] }>> {
  const jobs = await listRecentJobs(limit)
  if (jobs.length === 0) return []

  const placeholders = jobs.map(() => '?').join(',')
  const eventsResult = await db.execute({
    sql: `SELECT * FROM agent_events WHERE job_id IN (${placeholders}) ORDER BY job_id, sequence ASC`,
    args: jobs.map(job => job.id),
  })
  const eventsByJob = new Map<string, AgentEvent[]>()
  for (const row of eventsResult.rows) {
    const event = mapEvent(row as Record<string, unknown>)
    if (!eventsByJob.has(event.jobId)) eventsByJob.set(event.jobId, [])
    eventsByJob.get(event.jobId)!.push(event)
  }
  return jobs.map(job => ({ ...job, events: eventsByJob.get(job.id) ?? [] }))
}

export async function getAgentProductionStats(): Promise<AgentProductionStats> {
  const [jobRows, eventRows, perfRow] = await Promise.all([
    db.execute(`SELECT status, COUNT(*) AS count FROM agent_jobs GROUP BY status`),
    db.execute(`SELECT status, COUNT(*) AS count FROM agent_events WHERE status IN ('running', 'pending', 'failed') GROUP BY status`),
    db.execute(`
      SELECT
        AVG(CASE WHEN completed_at IS NOT NULL THEN completed_at - started_at ELSE NULL END) AS avg_duration_ms,
        AVG(CASE WHEN total_cost > 0 THEN total_cost ELSE NULL END) AS avg_cost
      FROM agent_jobs
      WHERE status IN ('completed', 'awaiting_validation')
    `),
  ])

  const jobs = { running: 0, completed: 0, failed: 0, awaitingValidation: 0 }
  for (const row of jobRows.rows as Array<Record<string, unknown>>) {
    const count = Number(row.count ?? 0)
    if (row.status === 'running') jobs.running = count
    if (row.status === 'completed') jobs.completed = count
    if (row.status === 'failed') jobs.failed = count
    if (row.status === 'awaiting_validation') jobs.awaitingValidation = count
  }

  const events = { running: 0, pending: 0, failed: 0 }
  for (const row of eventRows.rows as Array<Record<string, unknown>>) {
    const count = Number(row.count ?? 0)
    if (row.status === 'running') events.running = count
    if (row.status === 'pending') events.pending = count
    if (row.status === 'failed') events.failed = count
  }

  const perf = perfRow.rows[0] as Record<string, unknown> | undefined
  return {
    jobs,
    events,
    performance: {
      avgDurationMs: Math.round(Number(perf?.avg_duration_ms ?? 0)),
      avgCost: Number(Number(perf?.avg_cost ?? 0).toFixed(6)),
    },
  }
}

export async function listJobsByClient(clientId: string, limit = 20): Promise<AgentJob[]> {
  const result = await db.execute({
    sql: `SELECT j.*, c.name AS client_name, c.emoji AS client_emoji
          FROM agent_jobs j
          LEFT JOIN clients c ON c.id = j.client_id
          WHERE j.client_id = ?
          ORDER BY j.started_at DESC LIMIT ?`,
    args: [clientId, limit],
  })
  return result.rows.map(r => mapJob(r as Record<string, unknown>))
}

export async function getJobWithEvents(jobId: string): Promise<(AgentJob & { events: AgentEvent[] }) | null> {
  const jobResult = await db.execute({
    sql: `SELECT j.*, c.name AS client_name, c.emoji AS client_emoji
          FROM agent_jobs j
          LEFT JOIN clients c ON c.id = j.client_id
          WHERE j.id = ?`,
    args: [jobId],
  })
  if (!jobResult.rows[0]) return null

  const job = mapJob(jobResult.rows[0] as Record<string, unknown>)
  const eventsResult = await db.execute({
    sql: `SELECT * FROM agent_events WHERE job_id = ? ORDER BY sequence ASC`,
    args: [jobId],
  })

  return { ...job, events: eventsResult.rows.map(r => mapEvent(r as Record<string, unknown>)) }
}

// ─── Events ────────────────────────────────────────────────────────────────────

export async function createAgentEvent(params: {
  jobId: string
  agent: string
  sequence: number
  taskLabel: string
}): Promise<AgentEvent> {
  const id = nanoid(12)
  await db.execute({
    sql: `INSERT INTO agent_events (id, job_id, agent, sequence, status, task_label)
          VALUES (?, ?, ?, ?, 'pending', ?)`,
    args: [id, params.jobId, params.agent, params.sequence, params.taskLabel],
  })
  return {
    id, jobId: params.jobId, agent: params.agent,
    sequence: params.sequence, status: 'pending',
    taskLabel: params.taskLabel, outputSummary: null,
    outputData: null, errorMessage: null, errorAction: null,
    cost: 0, startedAt: null, completedAt: null,
  }
}

export async function startAgentEvent(eventId: string) {
  await db.execute({
    sql: `UPDATE agent_events SET status = 'running', started_at = ? WHERE id = ?`,
    args: [Date.now(), eventId],
  })
}

export async function completeAgentEvent(eventId: string, params: {
  status: EventStatus
  outputSummary?: string
  outputData?: Record<string, unknown>
  errorMessage?: string
  errorAction?: string
  cost?: number
}) {
  await db.execute({
    sql: `UPDATE agent_events
          SET status = ?, output_summary = ?, output_data = ?,
              error_message = ?, error_action = ?, cost = ?, completed_at = ?
          WHERE id = ?`,
    args: [
      params.status,
      params.outputSummary ?? null,
      params.outputData ? JSON.stringify(params.outputData) : null,
      params.errorMessage ?? null,
      params.errorAction ?? null,
      params.cost ?? 0,
      Date.now(),
      eventId,
    ],
  })
}

// Jobs bloqués en `running` depuis plus de STALE_THRESHOLD_MS — fonction serverless recyclée.
const STALE_THRESHOLD_MS = 10 * 60 * 1000 // 10 minutes

export async function listStaleJobs(): Promise<AgentJob[]> {
  const cutoff = Date.now() - STALE_THRESHOLD_MS
  const result = await db.execute({
    sql: `SELECT j.*, c.name AS client_name, c.emoji AS client_emoji
          FROM agent_jobs j
          LEFT JOIN clients c ON c.id = j.client_id
          WHERE j.status = 'running' AND j.started_at < ?
          ORDER BY j.started_at ASC`,
    args: [cutoff],
  })
  return result.rows.map(r => mapJob(r as Record<string, unknown>))
}
