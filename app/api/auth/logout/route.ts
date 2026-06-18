import { NextRequest, NextResponse } from 'next/server'
import { LEGACY_SESSION_COOKIE, SESSION_COOKIE } from '@/lib/auth/session'
import { destroySession } from '@/lib/auth/session-v2'

export async function POST(req: NextRequest) {
  await destroySession().catch(() => undefined)
  const res = NextResponse.redirect(new URL('/login', req.url), 303)
  res.cookies.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' })
  res.cookies.set(LEGACY_SESSION_COOKIE, '', { maxAge: 0, path: '/' })
  return res
}
