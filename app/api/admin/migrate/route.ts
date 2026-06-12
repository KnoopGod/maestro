import { NextRequest, NextResponse } from 'next/server'
import { dbConfig } from '@/lib/db'
import { initSchema } from '@/lib/db/schema'

export async function POST(req: NextRequest) {
  const expected = process.env.CRON_SECRET
  const provided = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')

  if (!expected || provided !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await initSchema()

  return NextResponse.json({
    ok: true,
    db: {
      isLocal: dbConfig.isLocalDb,
      schemaAutoInit: dbConfig.schemaAutoInit,
    },
  })
}
