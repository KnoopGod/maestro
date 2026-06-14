import { nanoid } from 'nanoid'
import { db, queryOne } from '../index'

export interface UserSession {
  id: string
  userId: string
  expiresAt: number
  createdAt: number
  ip: string | null
  userAgent: string | null
}

interface UserSessionRow {
  id: string
  user_id: string
  expires_at: number
  created_at: number
  ip: string | null
  user_agent: string | null
}

const DEFAULT_SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000

function mapRow(row: UserSessionRow): UserSession {
  return {
    id: row.id,
    userId: row.user_id,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    ip: row.ip,
    userAgent: row.user_agent,
  }
}

export async function createUserSession(
  userId: string,
  options?: { expiresInMs?: number; ip?: string; userAgent?: string }
): Promise<UserSession> {
  const id = nanoid(32)
  const now = Date.now()
  const expiresAt = now + (options?.expiresInMs ?? DEFAULT_SESSION_DURATION_MS)

  await db.execute({
    sql: `INSERT INTO user_sessions (id, user_id, expires_at, created_at, ip, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)`,
    args: [id, userId, expiresAt, now, options?.ip ?? null, options?.userAgent ?? null],
  })

  const session = await getUserSession(id)
  if (!session) throw new Error('Failed to create user session')
  return session
}

export async function getUserSession(id: string): Promise<UserSession | null> {
  const row = await queryOne<UserSessionRow>(
    `SELECT * FROM user_sessions WHERE id = ? AND expires_at >= ?`,
    [id, Date.now()]
  )
  return row ? mapRow(row) : null
}

export async function deleteUserSession(id: string): Promise<void> {
  await db.execute({ sql: `DELETE FROM user_sessions WHERE id = ?`, args: [id] })
}

export async function deleteUserSessionsByUserId(userId: string): Promise<void> {
  await db.execute({ sql: `DELETE FROM user_sessions WHERE user_id = ?`, args: [userId] })
}
