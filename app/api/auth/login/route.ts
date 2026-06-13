import { NextRequest, NextResponse } from 'next/server'
import { LEGACY_SESSION_COOKIE, SESSION_COOKIE, getAuthPassword, signSessionToken } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  let password: string | undefined
  let nextPath: string | undefined

  const ct = req.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    const body = await req.json().catch(() => ({}))
    password = body.password
    nextPath = body.next
  } else {
    const fd = await req.formData().catch(() => new FormData())
    password = fd.get('password') as string | undefined
    nextPath = fd.get('next') as string | undefined
  }

  const expected = getAuthPassword()

  if (!expected || !password || password !== expected) {
    return NextResponse.redirect(new URL('/login?error=1', req.url), 303)
  }

  const token = await signSessionToken(expected)
  const res = NextResponse.redirect(new URL(safeNextPath(nextPath), req.url), 303)
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  res.cookies.set(LEGACY_SESSION_COOKIE, '', { maxAge: 0, path: '/' })
  return res
}

function safeNextPath(nextPath: string | undefined) {
  if (!nextPath || !nextPath.startsWith('/') || nextPath.startsWith('//')) return '/'
  if (nextPath.startsWith('/login') || nextPath.startsWith('/api/auth')) return '/'
  return nextPath
}
