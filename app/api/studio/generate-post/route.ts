import { NextResponse } from 'next/server'
import { getClient } from '@/lib/db/queries/clients'
import { runPostPipeline } from '@/lib/agents/pipeline'
import type { PostPlatform } from '@/types/post'

export async function POST(req: Request) {
  try {
    const { clientId, brief, platforms, contentType = 'photo', skipImage, imageAssetId, imageAssetUrl } = await req.json()
    if (!clientId || !Array.isArray(platforms) || platforms.length === 0) return NextResponse.json({ error: 'clientId et platforms sont requis' }, { status: 400 })
    const client = await getClient(clientId)
    if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
    const existingAsset = typeof imageAssetId === 'string' && typeof imageAssetUrl === 'string' && imageAssetId && imageAssetUrl
      ? { id: imageAssetId, url: imageAssetUrl }
      : undefined
    const result = await runPostPipeline({ client, userBrief: typeof brief === 'string' ? brief : undefined, platforms: platforms as PostPlatform[], contentType, skipImage, existingAsset })
    return NextResponse.json({
      post: result.post,
      captions: result.captions,
      reasoning: result.reasoning,
      review: result.review,
      cost: result.totalCost,
      tokensUsed: result.totalTokens,
      model: result.models[result.models.length - 1] ?? 'fallback',
      directive: result.directive,
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur génération post complet' }, { status: 500 })
  }
}
