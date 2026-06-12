import { queryOne } from '@/lib/db'
import type { PostStatus } from '@/types/post'

export interface ProductionPostStats {
  total: number
  draft: number
  ready: number
  scheduled: number
  published: number
  failed: number
  avgCost: number
  avgTokens: number
}

export async function getProductionPostStats(): Promise<ProductionPostStats> {
  const row = await queryOne<{
    total: number
    draft: number
    ready: number
    scheduled: number
    published: number
    failed: number
    avg_cost: number | null
    avg_tokens: number | null
  }>(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft,
      SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) AS ready,
      SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) AS scheduled,
      SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failed,
      AVG(CASE WHEN cost > 0 THEN cost ELSE NULL END) AS avg_cost,
      AVG(CASE WHEN tokens_used > 0 THEN tokens_used ELSE NULL END) AS avg_tokens
    FROM posts
  `)

  return {
    total: Number(row?.total ?? 0),
    draft: Number(row?.draft ?? 0),
    ready: Number(row?.ready ?? 0),
    scheduled: Number(row?.scheduled ?? 0),
    published: Number(row?.published ?? 0),
    failed: Number(row?.failed ?? 0),
    avgCost: Number(Number(row?.avg_cost ?? 0).toFixed(6)),
    avgTokens: Math.round(Number(row?.avg_tokens ?? 0)),
  }
}

export const ACTIVE_POST_STATUSES: PostStatus[] = ['draft', 'ready', 'scheduled']
