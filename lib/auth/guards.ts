import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session-v2'
import { isMultiUserMode } from '@/lib/auth/mode'

export async function requireOwnerIfMultiUser() {
  if (!isMultiUserMode()) return { user: null, response: null }

  const user = await getSessionUser()
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }),
    }
  }

  if (user.role !== 'owner') {
    return {
      user,
      response: NextResponse.json({ error: 'Accès réservé au propriétaire' }, { status: 403 }),
    }
  }

  return { user, response: null }
}
