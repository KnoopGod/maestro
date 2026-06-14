import { NextRequest, NextResponse } from 'next/server'
import { listPosts, savePostInsights } from '@/lib/db/queries/posts'
import { getSocialAccount } from '@/lib/db/queries/social-accounts'
import { fetchFacebookInsights, fetchInstagramInsights } from '@/lib/agents/performance-analyst'
import type { PostInsights } from '@/types/post'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const MAX_POSTS_PER_RUN = 30
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000

export async function POST(req: NextRequest) {
  // Verify Vercel cron secret when set
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const cutoff = Date.now() - THIRTY_DAYS_MS
  const staleThreshold = Date.now() - TWELVE_HOURS_MS

  // Fetch published posts from the last 30 days
  const posts = await listPosts({
    status: 'published',
    publishedAfter: cutoff,
    includeInsights: true,
    orderBy: 'published_at',
    limit: 100,
  })

  // Prioritize posts without insights or with stale insights
  const toSync = posts
    .filter(p => {
      const lastFetch = p.metaInsights?.reduce((max, i) => Math.max(max, i.fetchedAt ?? 0), 0) ?? 0
      return lastFetch < staleThreshold
    })
    .slice(0, MAX_POSTS_PER_RUN)

  let synced = 0
  let skipped = 0
  const errors: string[] = []

  for (const post of toSync) {
    const hasMetaIds =
      (post.metaPostIds?.facebook || post.metaPostIds?.instagram)
    if (!hasMetaIds) { skipped++; continue }

    const insights: PostInsights[] = []

    if (post.metaPostIds?.facebook) {
      const acct = await getSocialAccount(post.clientId, 'facebook')
      if (acct?.accessToken) {
        const insight = await fetchFacebookInsights(post.metaPostIds.facebook, acct.accessToken)
        if (insight) insights.push(insight)
      }
    }

    if (post.metaPostIds?.instagram) {
      const acct = await getSocialAccount(post.clientId, 'instagram')
      if (acct?.accessToken) {
        const insight = await fetchInstagramInsights(post.metaPostIds.instagram, acct.accessToken)
        if (insight) insights.push(insight)
      }
    }

    if (insights.length > 0) {
      await savePostInsights(post.id, insights)
      synced++
    } else {
      errors.push(`Post ${post.id}: no insights returned`)
    }
  }

  return NextResponse.json({
    ok: true,
    synced,
    skipped,
    errors: errors.length ? errors : undefined,
    totalEligible: posts.length,
    ran: toSync.length,
  })
}
