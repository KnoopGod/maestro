import { NextRequest, NextResponse } from 'next/server'
import { getPost, schedulePost, unschedulePost } from '@/lib/db/queries/posts'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { scheduledAt } = await req.json()

    const post = await getPost(id)
    if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })

    const ts = typeof scheduledAt === 'number'
      ? scheduledAt
      : typeof scheduledAt === 'string'
        ? new Date(scheduledAt).getTime()
        : NaN

    if (!Number.isFinite(ts)) {
      return NextResponse.json({ error: 'scheduledAt invalide' }, { status: 400 })
    }
    if (ts < Date.now() - 60_000) {
      return NextResponse.json({ error: 'scheduledAt doit être dans le futur' }, { status: 400 })
    }

    const updated = await schedulePost(id, ts)
    return NextResponse.json({ post: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur planification'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const post = await getPost(id)
    if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
    const updated = await unschedulePost(id)
    return NextResponse.json({ post: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur déplanification'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
