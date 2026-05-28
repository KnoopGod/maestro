import { NextResponse } from 'next/server'
import { getClient } from '@/lib/db/queries/clients'
import { runPostPipeline } from '@/lib/agents/pipeline'
import { createAgentJob, completeAgentJob } from '@/lib/db/queries/agent-jobs'
import type { PostPlatform } from '@/types/post'

export async function POST(req: Request) {
  let jobId: string | undefined
  try {
    const { clientId, brief, platforms, contentType = 'photo', skipImage, imageAssetId, imageAssetUrl } = await req.json()
    if (!clientId || !Array.isArray(platforms) || platforms.length === 0) {
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
      : `Post ${(platforms as string[]).join('+')} — ${contentType}`

    const job = await createAgentJob({ clientId, trigger: 'manual', briefSummary })
    jobId = job.id

    const result = await runPostPipeline({
      client,
      userBrief: typeof brief === 'string' ? brief : undefined,
      platforms: platforms as PostPlatform[],
      contentType,
      skipImage,
      existingAsset,
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
    })
  } catch (err) {
    if (jobId) {
      await completeAgentJob(jobId, { status: 'failed', totalCost: 0 }).catch(() => undefined)
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur génération post complet' }, { status: 500 })
  }
}
