import { NextRequest, NextResponse } from 'next/server'
import { getUserById, updateUser } from '@/lib/db/queries/users'
import type { UserRole } from '@/lib/db/queries/users'

const ALLOWED_ROLES: UserRole[] = ['owner', 'editor']

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getUserById(id)
  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })

  let body: { name?: unknown; role?: unknown; active?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const update: Parameters<typeof updateUser>[1] = {}

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'Nom invalide' }, { status: 400 })
    }
    update.name = body.name.trim()
  }

  if (body.role !== undefined) {
    if (!ALLOWED_ROLES.includes(body.role as UserRole)) {
      return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
    }
    update.role = body.role as UserRole
  }

  if (body.active !== undefined) {
    if (typeof body.active !== 'boolean') {
      return NextResponse.json({ error: 'active doit être un booléen' }, { status: 400 })
    }
    update.active = body.active
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 })
  }

  const updated = await updateUser(id, update)
  return NextResponse.json({ user: updated })
}
