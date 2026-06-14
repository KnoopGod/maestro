import { NextRequest, NextResponse } from 'next/server'
import { listAuditLog, countAuditLog } from '@/lib/db/queries/audit-log'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0'), 0)

  const [entries, total] = await Promise.all([
    listAuditLog({ limit, offset }),
    countAuditLog(),
  ])

  return NextResponse.json({ entries, total })
}
