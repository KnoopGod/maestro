import { NextResponse } from 'next/server'
import { getClient } from '@/lib/db/queries/clients'
import { runPostPipeline } from '@/lib/agents/pipeline'
import { createAgentJob, completeAgentJob } from '@/lib/db/queries/agent-jobs'
import type { PostContentType, PostPlatform } from '@/types/post'

const ALLOWED_PLATFORMS = new Set<PostPlatform>(['instagram', 'facebook', 'tiktok', 'linkedin'])
const ALLOWED_CONTENT_TYPES = new Set<PostContentType>(['photo', 'reel', 'story'])

export async function POST(req: Request) {
  let jobId: string | undefined
  try {
    const { clientId, brief, platforms, contentType = 'photo', skipImage, imageAssetId, imageAssetUrl, ctaType, ctaUrl, visualPrompt } = await req.json()
    const validPlatforms = Array.isArray(platforms)
      ? platforms.filter((platform): platform is PostPlatform => ALLOWED_PLATFORMS.has(platform))
      : []
    const validContentType: PostContentType = ALLOWED_CONTENT_TYPES.has(contentType) ? contentType : 'photo'

    if (!clientId || validPlatforms.length === 0) {
      return NextResponse.json({ error: 'clientId et platforms sont requis' }, { status: 400 })
    }
    const client = await getClient(clientId)
    if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

    const existingAsset = typeof imageAssetId === 'string' && typeof imageAssetUrl === 'string' && imageAssetId && imageAssetUrl
      ? { id: imageAssetId, url: imageAssetUrl }
      : undefined

    // Créer le job de tracking avant de lancer le pipeline
    const briefSummary = typeof brief === 'string' && brief.trim()
      ? brief.trim().substring(0, 120)
      : `Post ${validPlatforms.join('+')} — ${validContentType}`

    const job = await createAgentJob({ clientId, trigger: 'manual', briefSummary })
    jobId = job.id

    const result = await runPostPipeline({
      client,
      userBrief: typeof brief === 'string' ? brief : undefined,
      platforms: validPlatforms,
      contentType: validContentType,
      skipImage,
      existingAsset,
      ctaType: typeof ctaType === 'string' && ctaType ? ctaType : undefined,
      ctaUrl: typeof ctaUrl === 'string' && ctaUrl ? ctaUrl : undefined,
      visualPrompt: typeof visualPrompt === 'string' && visualPrompt.trim() ? visualPrompt.trim() : undefined,
      jobId,
    })

    await completeAgentJob(jobId, {
      status: result.review?.verdict === 'blocked' ? 'awaiting_validation' : 'completed',
      postId: result.post.id,
      totalCost: result.totalCost,
    })

    return NextResponse.json({
      post: result.post,
      captions: result.captions,
      reasoning: result.reasoning,
      review: result.review,
      cost: result.totalCost,
      tokensUsed: result.totalTokens,
      model: result.models[result.models.length - 1] ?? 'fallback',
      directive: result.directive,
      jobId,
      imageError: result.imageError,
    })
  } catch (err) {
    if (jobId) {
      await completeAgentJob(jobId, { status: 'failed', totalCost: 0 }).catch(() => undefined)
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur génération post complet' }, { status: 500 })
  }
}
