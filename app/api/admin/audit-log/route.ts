import { NextRequest, NextResponse } from 'next/server'
import { requireOwnerIfMultiUser } from '@/lib/auth/guards'
import { listAuditLog, countAuditLog } from '@/lib/db/queries/audit-log'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await requireOwnerIfMultiUser()
  if (guard.response) return guard.response

  const { searchParams } = req.nextUrl
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0'), 0)

  const [entries, total] = await Promise.all([
    listAuditLog({ limit, offset }),
    countAuditLog(),
  ])

  return NextResponse.json({ entries, total })
}
