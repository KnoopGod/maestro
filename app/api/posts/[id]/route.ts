import { NextRequest, NextResponse } from 'next/server'
import { getPost, updatePostContent, deletePost } from '@/lib/db/queries/posts'

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

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const post = await getPost(id)
    if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
    if (post.status === 'published') {
      return NextResponse.json({ error: 'Un post déjà publié ne peut pas être supprimé.' }, { status: 409 })
    }
    await deletePost(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur suppression' }, { status: 500 })
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
      imageAssetId: body.imageAssetId === null ? null : typeof body.imageAssetId === 'string' ? body.imageAssetId : undefined,
      imageUrl: body.imageUrl === null ? null : typeof body.imageUrl === 'string' ? body.imageUrl : undefined,
      imagePrompt: body.imagePrompt === null ? null : typeof body.imagePrompt === 'string' ? body.imagePrompt : undefined,
    })

    return NextResponse.json({ post: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur mise à jour post'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const post = await getPost(id)
    if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
    if (post.status === 'published') {
      return NextResponse.json({ error: 'Un post publié ne peut pas être supprimé depuis la validation.' }, { status: 400 })
    }

    await deletePost(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur suppression post'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
