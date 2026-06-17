import { NextRequest, NextResponse } from 'next/server'
import { getClientByPortalToken } from '@/lib/db/queries/portal'
import { getPost, setPortalFeedback } from '@/lib/db/queries/posts'
import { notifyWebhook } from '@/lib/webhook/notify'
import type { PortalFeedback } from '@/types/post'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; postId: string }> }
) {
  const { token, postId } = await params

  const client = await getClientByPortalToken(token)
  if (!client) return NextResponse.json({ error: 'Lien invalide' }, { status: 404 })

  const post = await getPost(postId)
  if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })

  if (post.clientId !== client.id) {
    return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
  }
  if (post.status !== 'ready') {
    return NextResponse.json(
      { error: "Ce post n'est plus en attente de validation." },
      { status: 409 }
    )
  }

  let body: { action?: unknown; comment?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const { action, comment } = body
  if (action !== 'approved' && action !== 'changes_requested') {
    return NextResponse.json(
      { error: 'action doit être "approved" ou "changes_requested"' },
      { status: 400 }
    )
  }
  if (comment !== undefined && typeof comment !== 'string') {
    return NextResponse.json({ error: 'comment doit être une chaîne' }, { status: 400 })
  }

  const feedback: PortalFeedback = {
    action,
    comment: typeof comment === 'string' ? comment.trim().slice(0, 1000) : '',
    reviewedAt: Date.now(),
  }
  const updated = await setPortalFeedback(postId, feedback)

  notifyWebhook({
    event: action === 'approved' ? 'portal.approved' : 'portal.changes_requested',
    timestamp: feedback.reviewedAt,
    post: {
      id: post.id,
      clientName: client.name,
      platforms: post.platforms,
      imageUrl: post.imageUrl,
      caption: post.caption,
      portalComment: feedback.comment || undefined,
    },
  }).catch(() => undefined)

  return NextResponse.json({ ok: true, status: updated.status })
}
