import { NextRequest, NextResponse } from 'next/server'

async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder()
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(password))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({}))
  const expected = process.env.MAESTRO_PASSWORD

  if (!expected || !password || password !== expected) {
    await new Promise(r => setTimeout(r, 500))
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
  }

  const token = await hashPassword(expected)
  const res = NextResponse.json({ ok: true })
  res.cookies.set('maestro_session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
  return res
}
