import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, destroySession } from '@/lib/auth/session-v2'
import { logAudit } from '@/lib/db/queries/audit-log'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (user) {
    await logAudit({
      userId: user.id,
      action: 'auth.logout',
      ip: req.headers.get('x-forwarded-for') ?? undefined,
    })
  }
  await destroySession()
  return NextResponse.json({ ok: true })
}
