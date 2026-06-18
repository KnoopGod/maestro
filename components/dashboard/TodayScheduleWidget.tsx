import Link from 'next/link'
import Image from 'next/image'

import type { Post } from '@/types/post'
import type { Client } from '@/types/client'

const PLATFORM_EMOJI: Record<string, string> = {
  instagram: '📷',
  facebook: '👍',
  tiktok: '🎵',
  linkedin: '💼',
}

function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function dayLabel(ts: number, todayStart: number): string {
  const diff = Math.floor((ts - todayStart) / 86400000)
  if (diff === 0) return "Aujourd'hui"
  if (diff === 1) return 'Demain'
  return new Date(ts).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function TodayScheduleWidget({
  posts,
  clientsMap,
}: {
  posts: Post[]
  clientsMap: Map<string, Client>
}) {
  if (posts.length === 0) {
    return (
      <div className="flex items-center gap-2.5 p-3 bg-gray-900/40 border border-gray-800">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-600 flex-shrink-0" />
        <span className="text-[11px] text-gray-500 font-mono tracking-wide">Aucun post planifié cette semaine</span>
        <Link
          href="/studio"
          className="ml-auto text-[9px] text-indigo-500 hover:text-indigo-300 font-mono tracking-wider transition-colors"
        >
          CRÉER →
        </Link>
      </div>
    )
  }

  // Index map for prev/next navigation across all posts
  const postIndex = new Map(posts.map((p, i) => [p.id, i]))

  // Group posts by day (using scheduledAt)
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).getTime()
  const groups = new Map<number, Post[]>()
  for (const post of posts) {
    if (!post.scheduledAt) continue
    const dayStart = new Date(new Date(post.scheduledAt).setHours(0, 0, 0, 0)).getTime()
    if (!groups.has(dayStart)) groups.set(dayStart, [])
    groups.get(dayStart)!.push(post)
  }
  const sortedDays = [...groups.keys()].sort((a, b) => a - b)

  return (
    <div className="space-y-4">
      {sortedDays.map(dayStart => {
        const dayPosts = groups.get(dayStart)!
        const label = dayLabel(dayStart, todayStart)
        return (
          <div key={dayStart}>
            <div className="text-[9px] text-blue-600/60 font-mono tracking-[0.25em] uppercase mb-2">
              {label} — {dayPosts.length} post{dayPosts.length > 1 ? 's' : ''}
            </div>
            <div className="space-y-1.5">
              {dayPosts.map(post => {
                const client = clientsMap.get(post.clientId)
                const scheduledTime = post.scheduledAt ? fmtTime(post.scheduledAt) : '??:??'
                const idx = postIndex.get(post.id) ?? 0
                return (
                  <div
                    key={post.id}
                    className="flex items-center gap-3 p-3 bg-blue-950/20 border border-blue-900/30 hover:border-blue-600/40 transition-colors"
                  >
                    <span className="text-[10px] font-mono text-blue-400 w-10 flex-shrink-0">{scheduledTime}</span>

                    {post.imageUrl ? (
                      <div className="w-7 h-7 rounded overflow-hidden flex-shrink-0 relative">
                        <Image src={post.imageUrl} alt="" fill className="object-cover" sizes="28px" />
                      </div>
                    ) : (
                      <div className={`w-7 h-7 rounded bg-gradient-to-br ${client?.color ?? 'from-gray-700 to-gray-900'} flex items-center justify-center text-xs flex-shrink-0`}>
                        {client?.emoji ?? '📝'}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-[#E0E3FF] truncate font-mono tracking-wide">
                        {client?.name ?? 'Client inconnu'}
                      </div>
                      <div className="text-[9px] text-gray-500 font-mono flex items-center gap-1.5 mt-0.5">
                        {post.platforms.map(p => PLATFORM_EMOJI[p] ?? p).join(' ')}
                        <span className="text-gray-600">·</span>
                        <span className="truncate">{(post.brief || post.caption).substring(0, 40)}</span>
                      </div>
                    </div>

                    <Link
                      href={`/posts/${post.id}?from=dashboard${posts[idx - 1] ? `&prevId=${posts[idx - 1].id}` : ''}${posts[idx + 1] ? `&nextId=${posts[idx + 1].id}` : ''}`}
                      title="Voir le détail de ce post"
                      className="text-[9px] text-blue-500 hover:text-blue-300 font-mono tracking-wider transition-colors flex-shrink-0"
                    >
                      VOIR →
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="flex items-center justify-between pt-1">
        <span className="text-[9px] text-blue-400/60 font-mono">
          {posts.length} post{posts.length > 1 ? 's' : ''} planifié{posts.length > 1 ? 's' : ''} — 7 jours
        </span>
        <Link
          href="/plan?status=scheduled"
          className="text-[9px] text-indigo-500 hover:text-indigo-300 font-mono tracking-wider transition-colors"
        >
          TOUT LE PLAN →
        </Link>
      </div>
    </div>
  )
}
