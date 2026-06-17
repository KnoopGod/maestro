import { NextRequest, NextResponse } from 'next/server'
import { getPost, createPost } from '@/lib/db/queries/posts'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const source = await getPost(id)
    if (!source) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })

    const newPost = await createPost({
      clientId: source.clientId,
      platforms: source.platforms,
      contentType: source.contentType,
      brief: source.brief,
      pillar: source.pillar ?? undefined,
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
    })

    return NextResponse.json({ post: newPost })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur duplication' }, { status: 500 })
  }
}
