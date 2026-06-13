import { NextRequest, NextResponse } from 'next/server'
import { getPost, updatePostContent } from '@/lib/db/queries/posts'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const post = await getPost(id)
    if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
    return NextResponse.json({ post })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur lecture post'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const post = await getPost(id)
    if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })

    const body = await req.json()
    const hashtags = Array.isArray(body.hashtags)
      ? body.hashtags.map((tag: unknown) => String(tag).replace(/^#/, '').trim()).filter(Boolean).slice(0, 20)
      : undefined

    const updated = await updatePostContent(id, {
      caption: typeof body.caption === 'string' ? body.caption : undefined,
      hashtags,
      hook: typeof body.hook === 'string' ? body.hook : undefined,
      cta: typeof body.cta === 'string' ? body.cta : undefined,
      reasoning: typeof body.reasoning === 'string' ? body.reasoning : undefined,
    })

    return NextResponse.json({ post: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur mise à jour post'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
