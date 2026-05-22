import { query, queryOne } from '../index'

/**
 * Cost estimates for activities NOT yet tracked individually in DB.
 * Updated to match Claude pricing as of 2026.
 */
export const COST_ESTIMATES = {
  visionAnalysisPerImage: 0.009,   // ~1500 input + 300 output tokens, Sonnet
  daSynthesisPerClient: 0.020,     // Heavier prompt with all assets metadata
}

export interface UsageStats {
  totalCost: number
  totalTokens: number
  postsCount: number
  imagesAnalyzed: number
  daSyntheses: number
  // breakdown
  byClient: Array<{ clientId: string; clientName: string; emoji: string; cost: number; postsCount: number }>
  byActivity: { captionGeneration: number; visionAnalysis: number; daSynthesis: number }
  byMonth: Array<{ month: string; cost: number; postsCount: number }>
  // recent
  recentPosts: Array<{
    id: string
    clientId: string
    caption: string
    cost: number
    tokensUsed: number
    createdAt: number
  }>
}

export async function getUsageStats(): Promise<UsageStats> {
  // ─── Posts totals ─────────────────────────────────────────────
  const postsAgg = await queryOne<{ count: number; total_cost: number; total_tokens: number }>(
    `SELECT
      COUNT(*) as count,
      COALESCE(SUM(cost), 0) as total_cost,
      COALESCE(SUM(tokens_used), 0) as total_tokens
     FROM posts`
  )

  const postsCount = postsAgg?.count ?? 0
  const captionGenerationCost = postsAgg?.total_cost ?? 0
  const totalTokens = postsAgg?.total_tokens ?? 0

  // ─── Images analyzed (Vision) ─────────────────────────────────
  const imagesAgg = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM client_assets WHERE type = 'image' AND analyzed_at IS NOT NULL`
  )
  const imagesAnalyzed = imagesAgg?.count ?? 0
  const visionAnalysisCost = imagesAnalyzed * COST_ESTIMATES.visionAnalysisPerImage

  // ─── DA syntheses ──────────────────────────────────────────────
  const daAgg = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM client_visual_identity WHERE analyzed_at IS NOT NULL`
  )
  const daSyntheses = daAgg?.count ?? 0
  const daSynthesisCost = daSyntheses * COST_ESTIMATES.daSynthesisPerClient

  const totalCost = captionGenerationCost + visionAnalysisCost + daSynthesisCost

  // ─── By client ─────────────────────────────────────────────────
  const byClientRows = await query<{
    client_id: string
    client_name: string
    emoji: string
    cost: number
    posts_count: number
  }>(
    `SELECT
      c.id as client_id,
      c.name as client_name,
      c.emoji,
      COALESCE(SUM(p.cost), 0) as cost,
      COUNT(p.id) as posts_count
     FROM clients c
     LEFT JOIN posts p ON p.client_id = c.id
     GROUP BY c.id, c.name, c.emoji
     ORDER BY cost DESC`
  )

  const byClient = byClientRows.map(r => ({
    clientId: r.client_id,
    clientName: r.client_name,
    emoji: r.emoji,
    cost: r.cost,
    postsCount: r.posts_count,
  }))

  // ─── By month (last 6 months) ──────────────────────────────────
  const byMonthRows = await query<{ month: string; cost: number; count: number }>(
    `SELECT
      strftime('%Y-%m', datetime(created_at / 1000, 'unixepoch')) as month,
      COALESCE(SUM(cost), 0) as cost,
      COUNT(*) as count
     FROM posts
     GROUP BY month
     ORDER BY month DESC
     LIMIT 6`
  )

  const byMonth = byMonthRows.map(r => ({
    month: r.month,
    cost: r.cost,
    postsCount: r.count,
  })).reverse()

  // ─── Recent posts ──────────────────────────────────────────────
  const recentRows = await query<{
    id: string
    client_id: string
    caption: string
    cost: number
    tokens_used: number
    created_at: number
  }>(
    `SELECT id, client_id, caption, cost, tokens_used, created_at
     FROM posts
     ORDER BY created_at DESC
     LIMIT 10`
  )

  const recentPosts = recentRows.map(r => ({
    id: r.id,
    clientId: r.client_id,
    caption: r.caption,
    cost: r.cost,
    tokensUsed: r.tokens_used,
    createdAt: r.created_at,
  }))

  return {
    totalCost,
    totalTokens,
    postsCount,
    imagesAnalyzed,
    daSyntheses,
    byClient,
    byActivity: {
      captionGeneration: captionGenerationCost,
      visionAnalysis: visionAnalysisCost,
      daSynthesis: daSynthesisCost,
    },
    byMonth,
    recentPosts,
  }
}
