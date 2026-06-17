import { NextRequest, NextResponse } from 'next/server'
import { getPost, setPostStatus } from '@/lib/db/queries/posts'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const post = await getPost(id)
    if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
    if (post.status !== 'draft') {
      return NextResponse.json({ error: `Le post est déjà en statut "${post.status}".` }, { status: 409 })
    }

    const updated = await setPostStatus(id, 'ready')
    return NextResponse.json({ post: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur validation post'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
