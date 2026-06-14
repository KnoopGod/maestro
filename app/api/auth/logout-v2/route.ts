import { NextResponse } from 'next/server'
import { destroySession } from '@/lib/auth/session-v2'

export async function POST() {
  await destroySession()
  return NextResponse.json({ ok: true })
}
