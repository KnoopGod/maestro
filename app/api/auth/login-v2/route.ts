import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, setLastLogin } from '@/lib/db/queries/users'
import { verifyPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session-v2'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}))

  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  const user = await getUserByEmail(email.trim().toLowerCase())
  if (!user || !user.active) {
    return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 })
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 })
  }

  await createSession(user.id, {
    ip: req.headers.get('x-forwarded-for') ?? undefined,
    userAgent: req.headers.get('user-agent') ?? undefined,
  })
  await setLastLogin(user.id)

  return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } })
}
