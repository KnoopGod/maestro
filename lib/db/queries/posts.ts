import { nanoid } from 'nanoid'
import { query, queryOne } from '../index'
import type { Post, PostContentType, PostInsights, PostPlatform, PostStatus, SupervisorReview, PortalFeedback } from '@/types/post'

interface PostRow {
  id: string
  client_id: string
  status: PostStatus
  platforms: string
  content_type: PostContentType
  brief: string
  pillar: string | null
  reasoning: string | null
  caption: string
  hashtags: string | null
  hook: string | null
  cta: string | null
  cta_type: string | null
  cta_url: string | null
  image_asset_id: string | null
  image_url: string | null
  image_prompt: string | null
  impact_score: number
  impact_analysis: string | null
  supervisor_review: string | null
  portal_feedback: string | null
  meta_post_ids: string | null
  meta_insights: string | null
  scheduled_at: number | null
  published_at: number | null
  error: string | null
  cost: number
  tokens_used: number
  created_at: number
  updated_at: number
}

function mapRow(row: PostRow): Post {
  return {
    id: row.id,
    clientId: row.client_id,
    status: row.status,
    platforms: JSON.parse(row.platforms || '[]'),
    contentType: row.content_type,
    brief: row.brief,
    pillar: row.pillar,
    reasoning: row.reasoning,
    caption: row.caption,
    hashtags: row.hashtags ? JSON.parse(row.hashtags) : [],
    hook: row.hook,
    cta: row.cta,
    ctaType: row.cta_type ?? null,
    ctaUrl: row.cta_url ?? null,
    imageAssetId: row.image_asset_id,
    imageUrl: row.image_url,
    imagePrompt: row.image_prompt,
    impactScore: row.impact_score,
    impactAnalysis: row.impact_analysis,
    metaPostIds: row.meta_post_ids ? JSON.parse(row.meta_post_ids) : {},
    metaInsights: (() => { try { return row.meta_insights ? JSON.parse(row.meta_insights) as PostInsights[] : [] } catch { return [] } })(),
    supervisorReview: row.supervisor_review ? JSON.parse(row.supervisor_review) as SupervisorReview : null,
    portalFeedback: (() => { try { return row.portal_feedback ? JSON.parse(row.portal_feedback) as PortalFeedback : null } catch { return null } })(),
    scheduledAt: row.scheduled_at,
    publishedAt: row.published_at,
    error: row.error,
    cost: row.cost,
    tokensUsed: row.tokens_used,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function postSelect(includeInsights: boolean) {
  return `
    id, client_id, status, platforms, content_type, brief, pillar, reasoning,
    caption, hashtags, hook, cta, cta_type, cta_url, image_asset_id, image_url, image_prompt,
    impact_score, impact_analysis, supervisor_review, portal_feedback, meta_post_ids,
    ${includeInsights ? 'meta_insights' : 'NULL AS meta_insights'},
    scheduled_at, published_at, error, cost, tokens_used, created_at, updated_at
  `
}

export async function getPost(id: string): Promise<Post | null> {
  const row = await queryOne<PostRow>(`SELECT * FROM posts WHERE id = ?`, [id])
  return row ? mapRow(row) : null
}

export async function listPosts(options?: {
  clientId?: string
  status?: PostStatus
  statuses?: PostStatus[]
  limit?: number
  includeInsights?: boolean
  publishedAfter?: number
  orderBy?: 'created_at' | 'published_at'
  q?: string
}): Promise<Post[]> {
  const conditions: string[] = []
  const args: unknown[] = []
  const includeInsights = options?.includeInsights ?? true

  if (options?.clientId) {
    conditions.push('client_id = ?')
    args.push(options.clientId)
  }
  if (options?.status) {
    conditions.push('status = ?')
    args.push(options.status)
  } else if (options?.statuses?.length) {
    conditions.push(`status IN (${options.statuses.map(() => '?').join(',')})`)
    args.push(...options.statuses)
  }
  if (options?.publishedAfter !== undefined) {
    conditions.push('published_at >= ?')
    args.push(options.publishedAfter)
  }
  if (options?.q) {
    const like = `%${options.q}%`
    conditions.push('(caption LIKE ? OR brief LIKE ? OR hashtags LIKE ?)')
    args.push(like, like, like)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const limit = options?.limit ? `LIMIT ${options.limit}` : ''
  const orderBy = options?.orderBy ?? 'created_at'

  const rows = await query<PostRow>(
    `SELECT ${postSelect(includeInsights)} FROM posts ${where} ORDER BY ${orderBy} DESC ${limit}`,
    args
  )
  return rows.map(mapRow)
}

export async function deletePost(id: string): Promise<void> {
  await queryOne(`DELETE FROM posts WHERE id = ?`, [id])
}

export async function createPost(input: {
  clientId: string
  platforms: PostPlatform[]
  contentType: PostContentType
  brief: string
  pillar?: string
  reasoning?: string
  caption: string
  hashtags?: string[]
  hook?: string
  cta?: string
  ctaType?: string
  ctaUrl?: string
  imageAssetId?: string
  imageUrl?: string
  imagePrompt?: string
  impactScore?: number
  impactAnalysis?: string
  cost?: number
  tokensUsed?: number
}): Promise<Post> {
  const id = nanoid(12)
  const now = Date.now()

  const row = await queryOne<PostRow>(
    `INSERT INTO posts (
      id, client_id, status, platforms, content_type, brief, pillar, reasoning,
      caption, hashtags, hook, cta, cta_type, cta_url, image_asset_id, image_url, image_prompt,
      impact_score, impact_analysis, cost, tokens_used, created_at, updated_at
    ) VALUES (?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    [
      id,
      input.clientId,
      JSON.stringify(input.platforms),
      input.contentType,
      input.brief,
      input.pillar ?? null,
      input.reasoning ?? null,
      input.caption,
      JSON.stringify(input.hashtags ?? []),
      input.hook ?? null,
      input.cta ?? null,
      input.ctaType ?? null,
      input.ctaUrl ?? null,
      input.imageAssetId ?? null,
      input.imageUrl ?? null,
      input.imagePrompt ?? null,
      input.impactScore ?? 0,
      input.impactAnalysis ?? null,
      input.cost ?? 0,
      input.tokensUsed ?? 0,
      now,
      now,
    ]
  )
  if (!row) throw new Error('Failed to create post')
  return mapRow(row)
}

export async function updatePostContent(id: string, input: {
  caption?: string
  hashtags?: string[]
  hook?: string | null
  cta?: string | null
  reasoning?: string | null
  cost?: number
  tokensUsed?: number
  imageAssetId?: string | null
  imageUrl?: string | null
  imagePrompt?: string | null
}): Promise<Post> {
  const existing = await getPost(id)
  if (!existing) throw new Error('Post introuvable')

  const now = Date.now()
  const row = await queryOne<PostRow>(
    `UPDATE posts SET
      caption = ?,
      hashtags = ?,
      hook = ?,
      cta = ?,
      reasoning = ?,
      cost = ?,
      tokens_used = ?,
      image_asset_id = ?,
      image_url = ?,
      image_prompt = ?,
      updated_at = ?
    WHERE id = ? RETURNING *`,
    [
      input.caption ?? existing.caption,
      JSON.stringify(input.hashtags ?? existing.hashtags),
      input.hook === undefined ? existing.hook : input.hook,
      input.cta === undefined ? existing.cta : input.cta,
      input.reasoning === undefined ? existing.reasoning : input.reasoning,
      input.cost ?? existing.cost,
      input.tokensUsed ?? existing.tokensUsed,
      input.imageAssetId === undefined ? existing.imageAssetId : input.imageAssetId,
      input.imageUrl === undefined ? existing.imageUrl : input.imageUrl,
      input.imagePrompt === undefined ? existing.imagePrompt : input.imagePrompt,
      now,
      id,
    ]
  )
  if (!row) throw new Error('Failed to update post')
  return mapRow(row)
}

export async function markPostPublished(id: string, metaPostIds: Record<string, string>): Promise<Post> {
  const now = Date.now()
  const row = await queryOne<PostRow>(
    `UPDATE posts SET status = 'published', meta_post_ids = ?, published_at = ?, error = NULL, updated_at = ? WHERE id = ? RETURNING *`,
    [JSON.stringify(metaPostIds), now, now, id]
  )
  if (!row) throw new Error('Post not found')
  return mapRow(row)
}

export async function markPostFailed(id: string, error: string): Promise<Post> {
  const now = Date.now()
  const row = await queryOne<PostRow>(
    `UPDATE posts SET status = 'failed', error = ?, updated_at = ? WHERE id = ? RETURNING *`,
    [error, now, id]
  )
  if (!row) throw new Error('Post not found')
  return mapRow(row)
}

export async function setPostStatus(id: string, status: PostStatus): Promise<Post> {
  const now = Date.now()
  const row = await queryOne<PostRow>(
    `UPDATE posts SET status = ?, updated_at = ? WHERE id = ? RETURNING *`,
    [status, now, id]
  )
  if (!row) throw new Error('Post not found')
  return mapRow(row)
}

export async function schedulePost(id: string, scheduledAt: number): Promise<Post> {
  const now = Date.now()
  const row = await queryOne<PostRow>(
    `UPDATE posts SET status = 'scheduled', scheduled_at = ?, error = NULL, updated_at = ? WHERE id = ? RETURNING *`,
    [scheduledAt, now, id]
  )
  if (!row) throw new Error('Post not found')
  return mapRow(row)
}

export async function unschedulePost(id: string): Promise<Post> {
  const now = Date.now()
  const row = await queryOne<PostRow>(
    `UPDATE posts SET status = 'draft', scheduled_at = NULL, updated_at = ? WHERE id = ? RETURNING *`,
    [now, id]
  )
  if (!row) throw new Error('Post not found')
  return mapRow(row)
}

export async function setSupervisorReview(id: string, review: SupervisorReview): Promise<Post> {
  const now = Date.now()
  const row = await queryOne<PostRow>(
    `UPDATE posts SET supervisor_review = ?, updated_at = ? WHERE id = ? RETURNING *`,
    [JSON.stringify(review), now, id]
  )
  if (!row) throw new Error('Post not found')
  return mapRow(row)
}

export async function setPortalFeedback(id: string, feedback: PortalFeedback): Promise<Post> {
  const now = Date.now()
  const newStatus = feedback.action === 'changes_requested' ? 'draft' : undefined

  const row = await queryOne<PostRow>(
    newStatus
      ? `UPDATE posts SET portal_feedback = ?, status = ?, updated_at = ? WHERE id = ? RETURNING *`
      : `UPDATE posts SET portal_feedback = ?, updated_at = ? WHERE id = ? RETURNING *`,
    newStatus
      ? [JSON.stringify(feedback), newStatus, now, id]
      : [JSON.stringify(feedback), now, id]
  )
  if (!row) throw new Error('Post introuvable')
  return mapRow(row)
}

export async function savePostInsights(id: string, insights: PostInsights[]): Promise<void> {
  const now = Date.now()
  await queryOne(`UPDATE posts SET meta_insights = ?, updated_at = ? WHERE id = ?`, [JSON.stringify(insights), now, id])
}

export async function searchPosts(q: string): Promise<Post[]> {
  const like = `%${q}%`
  const rows = await query<PostRow>(
    `SELECT * FROM posts WHERE brief LIKE ? OR caption LIKE ? ORDER BY created_at DESC LIMIT 20`,
    [like, like]
  )
  return rows.map(mapRow)
}

export async function countPostsByStatus(statuses: PostStatus[]): Promise<number> {
  const placeholders = statuses.map(() => '?').join(',')
  const row = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM posts WHERE status IN (${placeholders})`,
    statuses
  )
  return row?.count ?? 0
}

export async function resetPostToDraft(id: string): Promise<Post> {
  const now = Date.now()
  const row = await queryOne<PostRow>(
    `UPDATE posts SET status = 'draft', error = NULL, updated_at = ? WHERE id = ? RETURNING *`,
    [now, id]
  )
  if (!row) throw new Error('Post introuvable')
  return mapRow(row)
}

export async function listDuePosts(now: number = Date.now()): Promise<Post[]> {
  const rows = await query<PostRow>(
    `SELECT * FROM posts WHERE status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= ? ORDER BY scheduled_at ASC`,
    [now]
  )
  return rows.map(mapRow)
}

export interface PillarCount {
  pillar: string
  count: number
}

/** Distribution of posts by pillar for a client, within the last `withinMs` ms (default 30 days). */
export async function getPillarDistribution(
  clientId: string,
  withinMs = 30 * 24 * 60 * 60 * 1000
): Promise<PillarCount[]> {
  const since = Date.now() - withinMs
  const rows = await query<{ pillar: string; count: number }>(
    `SELECT pillar, COUNT(*) AS count
     FROM posts
     WHERE client_id = ? AND pillar IS NOT NULL AND created_at > ?
     GROUP BY pillar
     ORDER BY count DESC`,
    [clientId, since]
  )
  return rows.map(r => ({ pillar: r.pillar, count: Number(r.count) }))
}

export interface FailedPostSummary {
  id: string
  clientId: string
  clientName: string
  error: string | null
  platforms: string[]
  updatedAt: number
}

/** Posts that failed within the last `withinMs` ms (default 48h). */
export async function listRecentlyFailedPosts(withinMs = 48 * 60 * 60 * 1000): Promise<FailedPostSummary[]> {
  const since = Date.now() - withinMs
  const rows = await query<{ id: string; client_id: string; client_name: string; error: string | null; platforms: string; updated_at: number }>(
    `SELECT p.id, p.client_id, c.name AS client_name, p.error, p.platforms, p.updated_at
     FROM posts p
     JOIN clients c ON c.id = p.client_id
     WHERE p.status = 'failed' AND p.updated_at > ?
     ORDER BY p.updated_at DESC
     LIMIT 10`,
    [since]
  )
  return rows.map(r => ({
    id: r.id,
    clientId: r.client_id,
    clientName: r.client_name,
    error: r.error,
    platforms: JSON.parse(r.platforms || '[]') as string[],
    updatedAt: r.updated_at,
  }))
}

/** Posts scheduled within the next `withinMs` ms (default: rest of today). */
export async function listUpcomingPosts(withinMs?: number): Promise<Post[]> {
  const now = Date.now()
  const until = withinMs !== undefined
    ? now + withinMs
    : new Date(new Date().setHours(23, 59, 59, 999)).getTime()
  const rows = await query<PostRow>(
    `SELECT ${postSelect(false)} FROM posts WHERE status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at > ? AND scheduled_at <= ? ORDER BY scheduled_at ASC LIMIT 20`,
    [now, until]
  )
  return rows.map(mapRow)
}
