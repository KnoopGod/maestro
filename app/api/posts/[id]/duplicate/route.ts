import { NextRequest, NextResponse } from 'next/server'
import { createPost, getPost } from '@/lib/db/queries/posts'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const source = await getPost(id)
    if (!source) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })

    const post = await createPost({
      clientId: source.clientId,
      platforms: source.platforms,
      contentType: source.contentType,
      brief: `${source.brief} (copie)`,
      reasoning: source.reasoning ?? undefined,
      caption: source.caption,
      hashtags: source.hashtags,
      hook: source.hook ?? undefined,
      cta: source.cta ?? undefined,
      ctaType: source.ctaType ?? undefined,
      ctaUrl: source.ctaUrl ?? undefined,
      imageAssetId: source.imageAssetId ?? undefined,
      imageUrl: source.imageUrl ?? undefined,
      imagePrompt: source.imagePrompt ?? undefined,
      impactScore: source.impactScore,
      impactAnalysis: source.impactAnalysis ?? undefined,
      cost: 0,
      tokensUsed: 0,
    })

    return NextResponse.json({ post })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur duplication'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
