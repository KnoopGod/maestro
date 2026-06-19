import { NextRequest, NextResponse } from 'next/server'
import { dbConfig } from '@/lib/db'
import { initSchema } from '@/lib/db/schema'
import { SESSION_COOKIE, getAuthPassword, isValidSessionToken, timingSafeEqual } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  const expected = process.env.CRON_SECRET ?? ''
  const auth = req.headers.get('authorization') || ''
  const provided = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret') ?? ''
  const hasCronSecret = expected.length > 0
  const authorizedByBearer = hasCronSecret && timingSafeEqual(auth, `Bearer ${expected}`)
  const authorizedBySecret = hasCronSecret && Boolean(provided) && timingSafeEqual(provided, expected)
  const authorizedBySession = await hasValidCODEXRSSession(req)

  if (!authorizedByBearer && !authorizedBySecret && !authorizedBySession) {
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

async function hasValidCODEXRSSession(req: NextRequest) {
  const password = getAuthPassword()
  if (!password) return false

  return isValidSessionToken(req.cookies.get(SESSION_COOKIE)?.value)
}
