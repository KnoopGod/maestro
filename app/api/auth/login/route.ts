import { NextRequest, NextResponse } from 'next/server'

async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder()
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(password))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(req: NextRequest) {
  let password: string | undefined

  const ct = req.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    const body = await req.json().catch(() => ({}))
    password = body.password
  } else {
    const fd = await req.formData().catch(() => new FormData())
    password = fd.get('password') as string | undefined
  }

  const expected = process.env.MAESTRO_PASSWORD

  if (!expected || !password || password !== expected) {
    return NextResponse.redirect(new URL('/login?error=1', req.url), 303)
  }

  const token = await hashPassword(expected)
  const res = NextResponse.redirect(new URL('/', req.url), 303)
  res.cookies.set('maestro_session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return res
}
