import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth/session-v2'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ user: null }, { status: 200 })
  return NextResponse.json({ user: { id: user.id, name: user.name, role: user.role } })
}
