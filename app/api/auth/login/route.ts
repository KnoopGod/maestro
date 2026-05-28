import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

function signToken(password: string): string {
  return createHmac('sha256', password).update('maestro-session').digest('hex')
}

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({}))
  const expected = process.env.MAESTRO_PASSWORD

  if (!expected || !password || password !== expected) {
    await new Promise(r => setTimeout(r, 500)) // anti-bruteforce delay
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
  }

  const token = signToken(expected)
  const res = NextResponse.json({ ok: true })
  res.cookies.set('maestro_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })
  return res
}
