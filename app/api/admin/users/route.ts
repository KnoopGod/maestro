import { NextRequest, NextResponse } from 'next/server'
import { createUser, listUsers } from '@/lib/db/queries/users'
import { hashPassword } from '@/lib/auth/password'
import type { UserRole } from '@/lib/db/queries/users'

const ALLOWED_ROLES: UserRole[] = ['owner', 'editor']

export async function GET() {
  const users = await listUsers()
  return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
  let body: { email?: unknown; name?: unknown; role?: unknown; password?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const { email, name, role = 'editor', password } = body

  if (typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
  }
  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Nom requis' }, { status: 400 })
  }
  if (!ALLOWED_ROLES.includes(role as UserRole)) {
    return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
  }
  if (typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Mot de passe requis (8 caractères minimum)' }, { status: 400 })
  }

  try {
    const passwordHash = await hashPassword(password)
    const user = await createUser({
      email: email.trim().toLowerCase(),
      name: name.trim(),
      role: role as UserRole,
      passwordHash,
    })
    return NextResponse.json({ user }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('UNIQUE')) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erreur création utilisateur' }, { status: 500 })
  }
}
