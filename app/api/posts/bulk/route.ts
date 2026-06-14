import { NextRequest, NextResponse } from 'next/server'
import { getPost, setPostStatus, deletePost } from '@/lib/db/queries/posts'
import type { PostStatus } from '@/types/post'

const ALLOWED_ACTIONS = ['delete', 'mark-ready', 'mark-draft'] as const
type BulkAction = (typeof ALLOWED_ACTIONS)[number]

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { ids, action } = body as { ids?: unknown; action?: unknown }

  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    ids.length > 50 ||
    !ALLOWED_ACTIONS.includes(action as BulkAction)
  ) {
    return NextResponse.json({ error: 'Champs invalides' }, { status: 400 })
  }

  const results = await Promise.allSettled(
    (ids as string[]).map(id => processOne(id, action as BulkAction))
  )
  const affected = results.filter(r => r.status === 'fulfilled').length
  const errors = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map(r => (r.reason instanceof Error ? r.reason.message : 'Erreur'))

  if (errors.length > 0 && affected === 0) {
    return NextResponse.json({ error: errors[0] }, { status: 422 })
  }

  return NextResponse.json(
    { ok: true, affected, errors: errors.length ? errors : undefined },
    { status: errors.length ? 207 : 200 }
  )
}

async function processOne(id: string, action: BulkAction) {
  const post = await getPost(id)
  if (!post) throw new Error(`Post introuvable`)

  if (action === 'delete') {
    if (post.status === 'published') throw new Error(`Post déjà publié — non supprimable`)
    await deletePost(id)
  } else {
    const targetStatus: PostStatus = action === 'mark-ready' ? 'ready' : 'draft'
    const allowed: PostStatus[] = action === 'mark-ready' ? ['draft', 'failed'] : ['ready']
    if (!allowed.includes(post.status)) {
      throw new Error(`Statut '${post.status}' incompatible avec '${action}'`)
    }
    await setPostStatus(id, targetStatus)
  }
}
