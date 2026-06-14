import { NextResponse } from 'next/server'
import { after } from 'next/server'
import { getClient } from '@/lib/db/queries/clients'
import { runPostPipeline } from '@/lib/agents/pipeline'
import { createAgentJob, completeAgentJob } from '@/lib/db/queries/agent-jobs'
import { proposePostIdeas } from '@/lib/agents/planner'
import type { PostContentType, PostPlatform } from '@/types/post'

export const maxDuration = 300

const ALLOWED_PLATFORMS = new Set<PostPlatform>(['instagram', 'facebook', 'tiktok', 'linkedin'])
const ALLOWED_CONTENT_TYPES = new Set<PostContentType>(['photo', 'reel', 'story'])
const MAX_BATCH = 7

export async function POST(req: Request) {
  try {
    const { clientId, count, platforms, contentType = 'photo', skipImage = false } = await req.json()

    const batchCount = Math.min(Math.max(Number(count) || 3, 1), MAX_BATCH)
    const validPlatforms = Array.isArray(platforms)
      ? platforms.filter((p): p is PostPlatform => ALLOWED_PLATFORMS.has(p))
      : []
    const validContentType: PostContentType = ALLOWED_CONTENT_TYPES.has(contentType) ? contentType : 'photo'

    if (!clientId || validPlatforms.length === 0) {
      return NextResponse.json({ error: 'clientId et platforms sont requis' }, { status: 400 })
    }

    const client = await getClient(clientId)
    if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

    // 1. Planner generates N ideas (distinct pillars)
    const plannerResult = await proposePostIdeas(client, batchCount)
    const ideas = plannerResult.ideas.slice(0, batchCount)

    // 2. Create one tracking job per idea, fire pipelines in background
    const jobIds: string[] = []

    for (const idea of ideas) {
      const briefSummary = idea.brief.substring(0, 120)
      const job = await createAgentJob({ clientId, trigger: 'batch', briefSummary })
      jobIds.push(job.id)

      const jobId = job.id
      const ideaCopy = { ...idea }

      after(async () => {
        try {
          const result = await runPostPipeline({
            client,
            userBrief: ideaCopy.brief,
            platforms: validPlatforms,
            contentType: validContentType,
            skipImage,
            jobId,
          })
          await completeAgentJob(jobId, {
            status: result.review?.verdict === 'blocked' ? 'awaiting_validation' : 'completed',
            postId: result.post.id,
            totalCost: result.totalCost,
          })
        } catch (err) {
          console.error(`Batch pipeline échoué (job ${jobId}):`, err)
          await completeAgentJob(jobId, { status: 'failed', totalCost: 0 }).catch(() => undefined)
        }
      })
    }

    return NextResponse.json({ jobIds, ideas }, { status: 202 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur génération en lot' },
      { status: 500 }
    )
  }
}
