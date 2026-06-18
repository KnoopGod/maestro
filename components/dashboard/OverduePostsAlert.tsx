import Link from 'next/link'
import { Clock } from 'lucide-react'
import type { Post } from '@/types/post'

function fmtRelative(ts: number, now: number): string {
  const h = Math.floor((now - ts) / 3_600_000)
  if (h < 24) return `${h}h de retard`
  return `${Math.floor(h / 24)}j de retard`
}

export function OverduePostsAlert({ posts, now }: { posts: Post[]; now: number }) {
  if (posts.length === 0) return null

  const oldest = posts[0].scheduledAt
  const delay = oldest ? Math.floor((now - oldest) / 3_600_000) : 0
  const shown = posts.slice(0, 3)

  return (
    <div className="bg-orange-950/20 border border-orange-700/40 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <Clock className="w-5 h-5 mt-0.5 flex-shrink-0 text-orange-400" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-orange-300 mb-1">
            {posts.length === 1
              ? '1 post planifié en retard de publication'
              : `${posts.length} posts planifiés en retard de publication`}
          </div>
          <p className="text-[11px] text-gray-400 mb-2">
            Le plus ancien est en retard de {delay}h. Le cron de publication est peut-être inactif.
          </p>
          <div className="space-y-1.5">
            {shown.map(p => (
              <Link
                key={p.id}
                href={`/posts/${p.id}?from=dashboard`}
                title="Voir le détail de ce post en retard"
                className="flex items-center gap-2 text-[11px] rounded-lg bg-orange-950/30 border border-orange-700/20 px-2.5 py-1.5 hover:border-orange-600/40 transition-colors"
              >
                <span className="text-orange-400/60 font-mono flex-shrink-0">{p.scheduledAt ? fmtRelative(p.scheduledAt, now) : '??'}</span>
                <span className="text-gray-300 flex-1 truncate">{p.brief || p.caption.substring(0, 50)}</span>
                <span className="text-orange-400/60 hover:text-orange-300 flex-shrink-0">→</span>
              </Link>
            ))}
            {posts.length > 3 && (
              <p className="text-[10px] text-gray-600 pl-2.5">+{posts.length - 3} autre{posts.length - 3 > 1 ? 's' : ''}</p>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <Link
              href="/calendar"
              className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
            >
              Voir dans le Calendrier →
            </Link>
            <Link
              href="/plan?status=scheduled"
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Voir dans le Plan →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
