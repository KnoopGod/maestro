import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/db/queries/clients'
import { getPost, setPostStatus, setSupervisorReview } from '@/lib/db/queries/posts'
import { supervisePost } from '@/lib/agents/supervisor'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const post = await getPost(id)
    if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })

    const client = await getClient(post.clientId)
    if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

    const result = await supervisePost({ client, post })
    await setSupervisorReview(post.id, result.review)

    // Auto-promote draft posts that the supervisor marks ready, so they can be scheduled.
    if (post.status === 'draft' && result.review.verdict === 'ready') {
      await setPostStatus(post.id, 'ready')
    }

    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur supervision'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
