import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { getClient } from '@/lib/db/queries/clients'
import { runPostPipeline } from '@/lib/agents/pipeline'
import { createAgentJob, completeAgentJob } from '@/lib/db/queries/agent-jobs'
import type { PostContentType, PostPlatform } from '@/types/post'

// Le pipeline (Account Director → Social Expert → Visual → Supervisor) peut durer
// 30-90s. On le lance en arrière-plan via after() : la requête HTTP rend la main
// immédiatement avec un jobId, et le client suit la progression par polling.
// maxDuration laisse au travail en arrière-plan le temps de finir hors timeout requête.
export const maxDuration = 300

const ALLOWED_PLATFORMS = new Set<PostPlatform>(['instagram', 'facebook', 'tiktok', 'linkedin'])
const ALLOWED_CONTENT_TYPES = new Set<PostContentType>(['photo', 'reel', 'story'])

export async function POST(req: Request) {
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
    const jobId = job.id

    // Exécution en arrière-plan — la réponse part avant la fin du pipeline.
    after(async () => {
      try {
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
      } catch (err) {
        console.error('Pipeline génération post échoué:', err)
        await completeAgentJob(jobId, { status: 'failed', totalCost: 0 }).catch(() => undefined)
      }
    })

    // 202 Accepted : le travail est accepté mais pas terminé. Le client poll /api/agents/jobs/[id].
    return NextResponse.json({ jobId }, { status: 202 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur génération post complet' }, { status: 500 })
  }
}
