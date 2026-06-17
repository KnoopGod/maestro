import { NextRequest, NextResponse } from 'next/server'
import { listPosts } from '@/lib/db/queries/posts'
import { getClient } from '@/lib/db/queries/clients'

function icalEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function icalDate(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`
}

function foldLine(line: string): string {
  if (line.length <= 75) return line
  const parts: string[] = []
  let i = 0
  while (i < line.length) {
    parts.push((i === 0 ? '' : ' ') + line.slice(i, i + (i === 0 ? 75 : 74)))
    i += i === 0 ? 75 : 74
  }
  return parts.join('\r\n')
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const clientId = searchParams.get('clientId') ?? undefined

  const posts = await listPosts({
    clientId,
    status: 'scheduled',
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

  const now = icalDate(Date.now())
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'PRODID:-//MAESTRO//Social Content Calendar//FR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:MAESTRO — Calendrier posts${clientId && clientNames.get(clientId) ? ` ${clientNames.get(clientId)}` : ''}`,
  ]

  for (const post of posts) {
    if (!post.scheduledAt) continue
    const start = icalDate(post.scheduledAt)
    const end = icalDate(post.scheduledAt + 30 * 60 * 1000)
    const clientName = clientNames.get(post.clientId) ?? 'Client'
    const platforms = post.platforms.join('+').toUpperCase()
    const summary = `${clientName} — ${platforms}${post.pillar ? ` (${post.pillar})` : ''}`
    const description = [
      post.brief ? `Brief: ${post.brief}` : '',
      '',
      post.caption,
      '',
      post.hashtags.length > 0 ? post.hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ') : '',
    ].filter((l, i, arr) => !(l === '' && arr[i - 1] === '')).join('\\n').trim()

    lines.push(
      'BEGIN:VEVENT',
      foldLine(`UID:${post.id}@maestro`),
      foldLine(`DTSTAMP:${now}`),
      foldLine(`DTSTART:${start}`),
      foldLine(`DTEND:${end}`),
      foldLine(`SUMMARY:${icalEscape(summary)}`),
      foldLine(`DESCRIPTION:${icalEscape(description)}`),
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')
  const ics = lines.join('\r\n')
  const filename = `maestro-calendar${clientId ? `-${clientId.slice(0, 8)}` : ''}.ics`

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
