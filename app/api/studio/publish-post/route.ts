import { NextRequest, NextResponse } from 'next/server'
import { getPost, markPostFailed } from '@/lib/db/queries/posts'
import { publishPost, PublishBlockedError } from '@/lib/agents/publish-pipeline'
import { createAgentJob, completeAgentJob, createAgentEvent, startAgentEvent, completeAgentEvent } from '@/lib/db/queries/agent-jobs'

export async function POST(req: NextRequest) {
  let postId: string | null = null
  let jobId: string | undefined

  try {
    const body = await req.json()
    postId = body.postId
    const forceTextOnly: boolean = !!body.forceTextOnly

    if (!postId) return NextResponse.json({ error: 'postId requis' }, { status: 400 })

    const post = await getPost(postId)
    if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })

    // Créer un job de tracking pour la publication
    const job = await createAgentJob({
      clientId: post.clientId,
      trigger: 'manual',
      briefSummary: `Publication du post #${post.id.substring(0, 6)}`,
    })
    jobId = job.id

    const event = await createAgentEvent({
      jobId, agent: 'publisher', sequence: 1,
      taskLabel: `Publication sur ${post.platforms.join(' + ')}`,
    })
    await startAgentEvent(event.id)

    const outcome = await publishPost(post, { forceTextOnly })

    const platformsSummary = Object.keys(outcome.published).join(' + ')
    await completeAgentEvent(event.id, {
      status: 'completed',
      outputSummary: `Publié sur ${platformsSummary}${outcome.warnings.length ? ' — avec avertissements' : ''}`,
      outputData: { published: outcome.published, warnings: outcome.warnings },
    })
    await completeAgentJob(jobId, { status: 'completed', postId, totalCost: 0 })

    return NextResponse.json({
      post: outcome.post,
      warnings: outcome.warnings.length > 0 ? outcome.warnings : undefined,
      review: outcome.review,
      jobId,
    })
  } catch (err) {
    if (err instanceof PublishBlockedError) {
      if (jobId) {
        await completeAgentJob(jobId, { status: 'awaiting_validation', totalCost: 0 }).catch(() => undefined)
      }
      return NextResponse.json({ error: err.message, review: err.review }, { status: 400 })
    }
    const message = err instanceof Error ? err.message : 'Erreur publication'
    if (postId) await markPostFailed(postId, message).catch(() => undefined)
    if (jobId) await completeAgentJob(jobId, { status: 'failed', totalCost: 0 }).catch(() => undefined)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
