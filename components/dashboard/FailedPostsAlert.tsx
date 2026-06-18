import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import type { FailedPostSummary } from '@/lib/db/queries/posts'

const PLATFORM_EMOJI: Record<string, string> = {
  instagram: '📷',
  facebook: '👍',
  linkedin: '💼',
  tiktok: '🎵',
}

function fmtRelative(ts: number): string {
  const diffMin = Math.floor((Date.now() - ts) / 60_000)
  if (diffMin < 60) return `il y a ${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH}h`
  return `il y a ${Math.floor(diffH / 24)}j`
}

export function FailedPostsAlert({ posts }: { posts: FailedPostSummary[] }) {
  if (posts.length === 0) return null

  return (
    <div className="bg-red-950/20 border border-red-800/40 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-400" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-red-300 mb-2">
            {posts.length === 1
              ? '1 publication a échoué dans les dernières 48h'
              : `${posts.length} publications ont échoué dans les dernières 48h`}
          </div>
          <div className="space-y-2">
            {posts.map(p => (
              <div key={p.id} className="flex items-start gap-2 text-xs">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-300">{p.clientName}</span>
                  <span className="text-gray-500 ml-1.5">
                    {p.platforms.map(pl => PLATFORM_EMOJI[pl] ?? pl).join(' ')}
                  </span>
                  {p.error && (
                    <p className="text-red-300/70 text-[10px] mt-0.5 truncate" title={p.error}>
                      {p.error.length > 80 ? p.error.substring(0, 80) + '…' : p.error}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-red-400/60 font-mono flex-shrink-0">
                  {fmtRelative(p.updatedAt)}
                </span>
                <Link
                  href={`/posts/${p.id}?from=dashboard`}
                  title="Voir le détail de ce post en échec"
                  className="text-[10px] text-red-400 hover:text-red-300 flex-shrink-0"
                >
                  Voir →
                </Link>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-600 mt-3">
            Ces posts sont en statut <span className="text-red-400/80">failed</span> — ouvre chaque post pour voir l&apos;erreur et republier manuellement.
          </p>
        </div>
      </div>
    </div>
  )
}
