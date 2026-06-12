import { NextResponse } from 'next/server'
import { getAgentProductionStats, listRecentJobsWithEvents } from '@/lib/db/queries/agent-jobs'
import { getProductionPostStats } from '@/lib/db/queries/production'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 12), 1), 50)
    const [postStats, agentStats, jobs] = await Promise.all([
      getProductionPostStats(),
      getAgentProductionStats(),
      listRecentJobsWithEvents(limit),
    ])

    return NextResponse.json({
      generatedAt: Date.now(),
      posts: postStats,
      agents: agentStats,
      jobs,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur monitoring' }, { status: 500 })
  }
}
