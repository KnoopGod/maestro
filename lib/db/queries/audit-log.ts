import { nanoid } from 'nanoid'
import { queryOne } from '../index'

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
