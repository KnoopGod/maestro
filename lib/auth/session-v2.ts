import { cookies } from 'next/headers'
import { createUserSession, getUserSession, deleteUserSession } from '@/lib/db/queries/user-sessions'
import { getUserById } from '@/lib/db/queries/users'
import type { User } from '@/lib/db/queries/users'

const COOKIE_NAME = 'maestro_session_v2'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 30 * 24 * 60 * 60, // 30 days
  path: '/',
}

export async function createSession(userId: string, meta?: { ip?: string; userAgent?: string }): Promise<void> {
  const session = await createUserSession(userId, { ip: meta?.ip, userAgent: meta?.userAgent })
  const jar = await cookies()
  jar.set(COOKIE_NAME, session.id, COOKIE_OPTIONS)
}

export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies()
  const sessionId = jar.get(COOKIE_NAME)?.value
  if (!sessionId) return null
  const session = await getUserSession(sessionId)
  if (!session) return null
  return getUserById(session.userId)
}

export async function destroySession(): Promise<void> {
  const jar = await cookies()
  const sessionId = jar.get(COOKIE_NAME)?.value
  if (sessionId) await deleteUserSession(sessionId)
  jar.delete(COOKIE_NAME)
}
