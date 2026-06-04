import { NextRequest, NextResponse } from 'next/server'
import { getPost, savePostInsights } from '@/lib/db/queries/posts'
import { getSocialAccount } from '@/lib/db/queries/social-accounts'
import { fetchFacebookInsights, fetchInstagramInsights } from '@/lib/agents/performance-analyst'
import type { PostInsights } from '@/types/post'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const post = await getPost(id)
    if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
    if (post.status !== 'published') {
      return NextResponse.json({ error: 'Insights disponibles uniquement pour les posts publiés' }, { status: 400 })
    }

    const insights: PostInsights[] = []
    const errors: string[] = []

    const facebookPostId = post.metaPostIds.facebook
    if (facebookPostId) {
      const account = await getSocialAccount(post.clientId, 'facebook')
      if (account?.accessToken) {
        const insight = await fetchFacebookInsights(facebookPostId, account.accessToken)
        if (insight) insights.push(insight)
        else errors.push('Facebook: insights indisponibles')
      } else {
        errors.push('Facebook: compte non connecté')
      }
    }

    const instagramPostId = post.metaPostIds.instagram
    if (instagramPostId) {
      const account = await getSocialAccount(post.clientId, 'instagram')
      if (account?.accessToken) {
        const insight = await fetchInstagramInsights(instagramPostId, account.accessToken)
        if (insight) insights.push(insight)
        else errors.push('Instagram: insights indisponibles')
      } else {
        errors.push('Instagram: compte non connecté')
      }
    }

    if (insights.length === 0) {
      return NextResponse.json(
        { error: errors.join(' · ') || 'Aucun identifiant Meta exploitable' },
        { status: 400 }
      )
    }

    await savePostInsights(post.id, insights)

    return NextResponse.json({
      success: true,
      insights,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur insights'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
