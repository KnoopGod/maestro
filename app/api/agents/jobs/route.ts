import { NextResponse } from 'next/server'
import { listRecentJobs } from '@/lib/db/queries/agent-jobs'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const jobs = await listRecentJobs(40)
    return NextResponse.json({ jobs })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}
