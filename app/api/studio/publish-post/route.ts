import { NextRequest, NextResponse } from 'next/server'
import { getPost, markPostFailed } from '@/lib/db/queries/posts'
import { publishPost, PublishBlockedError } from '@/lib/agents/publish-pipeline'

export async function POST(req: NextRequest) {
  let postId: string | null = null
  try {
    const body = await req.json()
    postId = body.postId
    const forceTextOnly: boolean = !!body.forceTextOnly

    if (!postId) {
      return NextResponse.json({ error: 'postId requis' }, { status: 400 })
    }

    const post = await getPost(postId)
    if (!post) {
      return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
    }

    const outcome = await publishPost(post, { forceTextOnly })

    return NextResponse.json({
      post: outcome.post,
      warnings: outcome.warnings.length > 0 ? outcome.warnings : undefined,
      review: outcome.review,
    })
  } catch (err) {
    if (err instanceof PublishBlockedError) {
      return NextResponse.json(
        { error: err.message, review: err.review },
        { status: 400 }
      )
    }
    const message = err instanceof Error ? err.message : 'Erreur publication'
    if (postId) await markPostFailed(postId, message).catch(() => undefined)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
