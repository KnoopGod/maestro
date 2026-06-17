import { NextRequest, NextResponse } from 'next/server'
import { listPosts } from '@/lib/db/queries/posts'
import { getClient } from '@/lib/db/queries/clients'
import type { PostStatus } from '@/types/post'

function escapeCsv(v: unknown): string {
  const s = v == null ? '' : String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function fmtDate(ts: number | null | undefined): string {
  if (!ts) return ''
  return new Date(ts).toLocaleString('fr-FR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const clientId = searchParams.get('clientId') ?? undefined
  const status = (searchParams.get('status') as PostStatus | null) ?? undefined

  const posts = await listPosts({
    clientId,
    status,
    limit: 500,
    includeInsights: false,
  })

  const clientNames = new Map<string, string>()
  await Promise.all(
    [...new Set(posts.map(p => p.clientId))].map(async id => {
      const c = await getClient(id)
      if (c) clientNames.set(id, c.name)
    })
  )

  const headers = [
    'id', 'client', 'statut', 'plateformes', 'type', 'pilier',
    'brief', 'caption', 'hashtags', 'hook', 'cta',
    'impact', 'coût', 'créé le', 'planifié le', 'publié le',
  ]

  const rows = posts.map(p => [
    p.id,
    clientNames.get(p.clientId) ?? p.clientId,
    p.status,
    p.platforms.join('+'),
    p.contentType,
    p.pillar ?? '',
    p.brief,
    p.caption,
    p.hashtags.join(' '),
    p.hook ?? '',
    p.cta ?? '',
    p.impactScore,
    p.cost.toFixed(4),
    fmtDate(p.createdAt),
    fmtDate(p.scheduledAt),
    fmtDate(p.publishedAt),
  ])

  const csv = [headers, ...rows].map(r => r.map(escapeCsv).join(',')).join('\n')
  const filename = `maestro-posts-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
