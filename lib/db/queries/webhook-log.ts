import { nanoid } from 'nanoid'
import { db, query, queryOne } from '../index'

export type WebhookStatus = 'success' | 'failed' | 'timeout'

interface WebhookDeliveryRow {
  id: string
  event: string
  payload: string
  status: WebhookStatus
  http_status: number | null
  duration_ms: number | null
  error: string | null
  created_at: number
}

export interface WebhookDelivery {
  id: string
  event: string
  payload: unknown
  status: WebhookStatus
  httpStatus: number | null
  durationMs: number | null
  error: string | null
  createdAt: number
}

function mapRow(row: WebhookDeliveryRow): WebhookDelivery {
  return {
    id: row.id,
    event: row.event,
    payload: (() => { try { return JSON.parse(row.payload) } catch { return {} } })(),
    status: row.status,
    httpStatus: row.http_status,
    durationMs: row.duration_ms,
    error: row.error,
    createdAt: row.created_at,
  }
}

export async function logWebhookDelivery(opts: {
  event: string
  payload: unknown
  status: WebhookStatus
  httpStatus?: number
  durationMs?: number
  error?: string
}): Promise<void> {
  const id = nanoid(12)
  await db.execute({
    sql: `INSERT INTO webhook_deliveries (id, event, payload, status, http_status, duration_ms, error, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      opts.event,
      JSON.stringify(opts.payload),
      opts.status,
      opts.httpStatus ?? null,
      opts.durationMs ?? null,
      opts.error ?? null,
      Date.now(),
    ],
  })
}

export async function listRecentWebhookDeliveries(limit = 20): Promise<WebhookDelivery[]> {
  const rows = await query<WebhookDeliveryRow>(
    `SELECT * FROM webhook_deliveries ORDER BY created_at DESC LIMIT ?`,
    [limit]
  )
  return rows.map(mapRow)
}

export async function countWebhookDeliveries(): Promise<{ total: number; failures: number }> {
  const row = await queryOne<{ total: number; failures: number }>(
    `SELECT COUNT(*) as total, SUM(CASE WHEN status != 'success' THEN 1 ELSE 0 END) as failures FROM webhook_deliveries`,
    []
  )
  return { total: row?.total ?? 0, failures: row?.failures ?? 0 }
}
