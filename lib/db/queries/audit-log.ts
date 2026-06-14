import { nanoid } from 'nanoid'
import { query, queryOne } from '../index'

export interface AuditLogEntry {
  id: string
  userId: string | null
  action: string
  resourceType: string | null
  resourceId: string | null
  metadata: Record<string, unknown> | null
  createdAt: number
  ip: string | null
}

export interface LogAuditParams {
  userId?: string
  action: string
  resourceType?: string
  resourceId?: string
  metadata?: Record<string, unknown>
  ip?: string
}

interface AuditLogRow {
  id: string
  user_id: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  metadata: string | null
  created_at: number
  ip: string | null
}

export async function listAuditLog(options?: { limit?: number; offset?: number }): Promise<AuditLogEntry[]> {
  const limit = options?.limit ?? 50
  const offset = options?.offset ?? 0
  const rows = await query<AuditLogRow>(
    `SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  )
  return rows.map(r => ({
    id: r.id,
    userId: r.user_id,
    action: r.action,
    resourceType: r.resource_type,
    resourceId: r.resource_id,
    metadata: r.metadata ? JSON.parse(r.metadata) as Record<string, unknown> : null,
    createdAt: r.created_at,
    ip: r.ip,
  }))
}

export async function countAuditLog(): Promise<number> {
  const row = await queryOne<{ n: number }>(`SELECT COUNT(*) AS n FROM audit_log`)
  return row?.n ?? 0
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    const id = nanoid()
    const now = Date.now()
    await queryOne(
      `INSERT INTO audit_log (id, user_id, action, resource_type, resource_id, metadata, created_at, ip)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        params.userId ?? null,
        params.action,
        params.resourceType ?? null,
        params.resourceId ?? null,
        params.metadata ? JSON.stringify(params.metadata) : null,
        now,
        params.ip ?? null,
      ]
    )
  } catch (err) {
    console.error('[audit-log] Failed to write audit entry:', err)
  }
}
