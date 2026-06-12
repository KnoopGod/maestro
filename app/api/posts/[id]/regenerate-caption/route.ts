import { NextResponse } from 'next/server'
import { getClient } from '@/lib/db/queries/clients'
import { getPost, updatePostContent } from '@/lib/db/queries/posts'
import { generateCaption, type Platform } from '@/lib/agents/social-expert'

const ALLOWED_PLATFORMS = new Set<Platform>(['instagram', 'facebook', 'tiktok', 'linkedin'])

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const post = await getPost(id)
    if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })

    const client = await getClient(post.clientId)
    if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

    const platforms = post.platforms.filter((platform): platform is Platform => ALLOWED_PLATFORMS.has(platform as Platform))
    if (platforms.length === 0) {
      return NextResponse.json({ error: 'Aucune plateforme compatible pour régénérer le texte' }, { status: 400 })
    }

    const result = await generateCaption({
      client,
      brief: post.brief,
      platforms,
      contentType: post.contentType,
    })

    const primaryCaption = result.captions[0]
    const updated = await updatePostContent(post.id, {
      caption: primaryCaption.caption,
      hashtags: primaryCaption.hashtags,
      hook: primaryCaption.hook,
      cta: primaryCaption.cta,
      reasoning: result.reasoning,
      cost: post.cost + result.cost,
      tokensUsed: post.tokensUsed + result.tokensUsed,
    })

    return NextResponse.json({
      post: updated,
      captions: result.captions,
      reasoning: result.reasoning,
      cost: updated.cost,
      tokensUsed: updated.tokensUsed,
      model: result.model,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur régénération texte'
    const status = message.includes('ANTHROPIC_API_KEY') ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
