import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/db/queries/clients'
import { listPosts } from '@/lib/db/queries/posts'
import { runAccountDirector } from '@/lib/agents/account-director'

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId')
  if (!clientId) return NextResponse.json({ error: 'clientId requis' }, { status: 400 })

  const [client, recentPosts] = await Promise.all([
    getClient(clientId),
    listPosts({ clientId, limit: 15 }),
  ])
  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

  const topPosts = [...recentPosts]
    .filter(p => p.metaInsights?.length)
    .sort((a, b) => {
      const eng = (p: typeof a) => p.metaInsights?.reduce((s, i) => {
        const r = i.reach ?? 0
        return r ? s + ((i.likes ?? 0) + (i.comments ?? 0) + (i.shares ?? 0)) / r * 100 : s
      }, 0) ?? 0
      return eng(b) - eng(a)
    })
    .slice(0, 3)

  try {
    const { directive, cost, tokensUsed } = await runAccountDirector({
      client,
      recentPosts,
      topPosts,
      runAt: new Date().toISOString(),
    })

    return NextResponse.json({ directive, cost, tokensUsed })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur agent' },
      { status: 500 }
    )
  }
}
