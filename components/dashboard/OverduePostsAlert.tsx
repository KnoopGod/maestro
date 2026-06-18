import Link from 'next/link'
import { Clock } from 'lucide-react'
import type { Post } from '@/types/post'

export function OverduePostsAlert({ posts, now }: { posts: Post[]; now: number }) {
  if (posts.length === 0) return null

  const oldest = posts[0].scheduledAt
  const delay = oldest ? Math.floor((now - oldest) / 3_600_000) : 0

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
          <p className="text-[11px] text-gray-400">
            Le plus ancien est en retard de {delay}h. Le cron de publication est peut-être inactif.
          </p>
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
