import { NextRequest, NextResponse } from 'next/server'
import { getPost, resetPostToDraft } from '@/lib/db/queries/posts'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const post = await getPost(id)
    if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
    if (post.status === 'published') {
      return NextResponse.json({ error: 'Un post publié ne peut pas être remis en brouillon.' }, { status: 400 })
    }

    const updated = await resetPostToDraft(id)
    return NextResponse.json({ post: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur remise en brouillon'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
