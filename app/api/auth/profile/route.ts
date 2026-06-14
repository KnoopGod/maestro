import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session-v2'
import { getUserById, getUserByEmail, updateUser, updateUserPassword } from '@/lib/db/queries/users'
import { verifyPassword, hashPassword } from '@/lib/auth/password'
import { logAudit } from '@/lib/db/queries/audit-log'

export async function PATCH(req: NextRequest) {
  const sessionUser = await getSessionUser()
  if (!sessionUser) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { name, currentPassword, newPassword } = body as Record<string, unknown>

  let didSomething = false

  if (typeof name === 'string' && name.trim().length > 0) {
    await updateUser(sessionUser.id, { name: name.trim().slice(0, 100) })
    didSomething = true
  }

  if (newPassword !== undefined) {
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return NextResponse.json({ error: 'currentPassword et newPassword requis' }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Le nouveau mot de passe doit faire au moins 8 caractères' }, { status: 400 })
    }

    const userWithHash = await getUserByEmail(sessionUser.email)
    if (!userWithHash) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

    const valid = await verifyPassword(currentPassword, userWithHash.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 403 })
    }

    await updateUserPassword(sessionUser.id, await hashPassword(newPassword))
    await logAudit({
      userId: sessionUser.id,
      action: 'auth.password_changed',
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })
    didSomething = true
  }

  if (!didSomething) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
  }

  const updated = await getUserById(sessionUser.id)
  if (!updated) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
  return NextResponse.json({ ok: true, user: { id: updated.id, name: updated.name, role: updated.role } })
}
