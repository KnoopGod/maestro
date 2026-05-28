import { NextRequest, NextResponse } from 'next/server'

async function signToken(password: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('maestro-session'))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({}))
  const expected = process.env.MAESTRO_PASSWORD

  if (!expected || !password || password !== expected) {
    await new Promise(r => setTimeout(r, 500))
    return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 })
  }

  const token = await signToken(expected)
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
