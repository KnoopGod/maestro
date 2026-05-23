import { NextResponse } from 'next/server'
import { getClient } from '@/lib/db/queries/clients'
import { listPosts, savePostInsights } from '@/lib/db/queries/posts'
import { listClientSocialAccounts } from '@/lib/db/queries/social-accounts'
import {
  fetchFacebookInsights,
  fetchInstagramInsights,
  analyzePerformance,
} from '@/lib/agents/performance-analyst'
import type { PostInsights } from '@/types/post'

/**
 * POST /api/clients/[id]/performance
 * Fetches Meta insights for all published posts, stores them, runs Claude analysis.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: clientId } = await params
    const client = await getClient(clientId)
    if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

    const [publishedPosts, socialAccounts] = await Promise.all([
      listPosts({ clientId, status: 'published' }),
      listClientSocialAccounts(clientId),
    ])

    const fbAccount = socialAccounts.find(a => a.platform === 'facebook')
    const igAccount = socialAccounts.find(a => a.platform === 'instagram')

    // Fetch Meta insights for each published post (skip if already fetched in last 6h)
    const SIX_HOURS = 6 * 60 * 60 * 1000
    const now = Date.now()

    const postsWithInsights = await Promise.all(
      publishedPosts.map(async post => {
        const alreadyFresh = post.metaInsights.length > 0 &&
          post.metaInsights.every(i => now - i.fetchedAt < SIX_HOURS)
        if (alreadyFresh) return post

        const freshInsights: PostInsights[] = []

        if (fbAccount?.accessToken && post.metaPostIds['facebook']) {
          const ins = await fetchFacebookInsights(post.metaPostIds['facebook'], fbAccount.accessToken)
          if (ins) freshInsights.push(ins)
        }
        if (igAccount?.accessToken && post.metaPostIds['instagram']) {
          const ins = await fetchInstagramInsights(post.metaPostIds['instagram'], igAccount.accessToken)
          if (ins) freshInsights.push(ins)
        }

        if (freshInsights.length > 0) {
          await savePostInsights(post.id, freshInsights)
          return { ...post, metaInsights: freshInsights }
        }
        return post
      })
    )

    const postsData = postsWithInsights.map(p => ({
      caption: p.caption,
      platforms: p.platforms,
      brief: p.brief,
      publishedAt: p.publishedAt,
      insights: p.metaInsights,
    }))

    const result = await analyzePerformance({ client, posts: postsData })

    return NextResponse.json({
      analysis: result.analysis,
      postsAnalyzed: postsWithInsights.length,
      postsWithInsights: postsWithInsights.filter(p => p.metaInsights.length > 0).length,
      cost: result.cost,
      model: result.model,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur analyse performance' },
      { status: 500 }
    )
  }
}
