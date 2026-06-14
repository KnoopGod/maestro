import { NextRequest, NextResponse } from 'next/server'
import { deletePosts } from '@/lib/db/queries/posts'

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const rawIds: unknown[] = Array.isArray((body as { ids?: unknown }).ids)
      ? (body as { ids: unknown[] }).ids
      : []
    const ids = rawIds.map(id => String(id).trim()).filter(id => id.length > 0)

    if (ids.length === 0) {
      return NextResponse.json({ error: 'Aucun post sélectionné.' }, { status: 400 })
    }

    const deleted = await deletePosts(ids)
    return NextResponse.json({ ok: true, deleted })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur suppression posts'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
