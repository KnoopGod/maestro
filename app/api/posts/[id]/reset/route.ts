import { NextRequest, NextResponse } from 'next/server'
import { getPost, resetPostToDraft } from '@/lib/db/queries/posts'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getPost(id)
  if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
  if (post.status !== 'failed') {
    return NextResponse.json({ error: 'Seuls les posts en échec peuvent être remis en brouillon' }, { status: 400 })
  }
  const updated = await resetPostToDraft(id)
  return NextResponse.json({ post: updated })
}
