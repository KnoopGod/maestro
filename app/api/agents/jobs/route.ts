import { NextResponse } from 'next/server'
import { listRecentJobs, listRecentJobsWithEvents } from '@/lib/db/queries/agent-jobs'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 40), 1), 100)
    const includeEvents = url.searchParams.get('events') === '1'
    const jobs = includeEvents ? await listRecentJobsWithEvents(limit) : await listRecentJobs(limit)
    return NextResponse.json({ jobs })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}
