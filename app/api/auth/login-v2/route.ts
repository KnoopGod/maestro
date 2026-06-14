import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail, setLastLogin } from '@/lib/db/queries/users'
import { verifyPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session-v2'
import { logAudit } from '@/lib/db/queries/audit-log'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}))

  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
  }

  const ip = req.headers.get('x-forwarded-for') ?? undefined

  const user = await getUserByEmail(email.trim().toLowerCase())
  if (!user || !user.active) {
    await logAudit({ action: 'auth.login.failed', metadata: { email, reason: 'unknown_user' }, ip })
    return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 })
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    await logAudit({ userId: user.id, action: 'auth.login.failed', metadata: { reason: 'bad_password' }, ip })
    return NextResponse.json({ error: 'Email ou mot de passe incorrect' }, { status: 401 })
  }

  await createSession(user.id, {
    ip,
    userAgent: req.headers.get('user-agent') ?? undefined,
  })
  await setLastLogin(user.id)
  await logAudit({ userId: user.id, action: 'auth.login', ip })

  return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } })
}
