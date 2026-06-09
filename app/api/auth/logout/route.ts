import { NextResponse } from 'next/server'
import { LEGACY_SESSION_COOKIE, SESSION_COOKIE } from '@/lib/auth/session'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' })
  res.cookies.set(LEGACY_SESSION_COOKIE, '', { maxAge: 0, path: '/' })
  return res
}
