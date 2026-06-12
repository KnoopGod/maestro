import { getAgentProductionStats, listRecentJobsWithEvents } from '@/lib/db/queries/agent-jobs'
import { getProductionPostStats } from '@/lib/db/queries/production'
import { ProductionLiveDashboard } from '@/components/production/ProductionLiveDashboard'

export const dynamic = 'force-dynamic'

export default async function ProductionPage() {
  const [posts, agents, jobs] = await Promise.all([
    getProductionPostStats(),
    getAgentProductionStats(),
    listRecentJobsWithEvents(16),
  ])

  return (
    <ProductionLiveDashboard
      initial={{
        generatedAt: 0,
        posts,
        agents,
        jobs,
      }}
    />
  )
}
