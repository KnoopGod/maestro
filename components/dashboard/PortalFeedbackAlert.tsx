import Link from 'next/link'
import { MessageSquare, CheckCircle2, Edit3 } from 'lucide-react'
import type { PortalFeedbackSummary } from '@/lib/db/queries/posts'

function since(ts: number): string {
  const diff = Date.now() - ts
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'à l\'instant'
  if (h < 24) return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}

export function PortalFeedbackAlert({ posts }: { posts: PortalFeedbackSummary[] }) {
  if (posts.length === 0) return null

  const approvedCount = posts.filter(p => p.feedbackAction === 'approved').length
  const changesCount = posts.filter(p => p.feedbackAction === 'changes_requested').length

  return (
    <div className="bg-cyan-950/20 border border-cyan-800/30 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-cyan-400 flex-shrink-0" />
        <h2 className="text-sm font-semibold text-cyan-200">
          Retours clients — portail
        </h2>
        <div className="flex items-center gap-2 ml-auto">
          {approvedCount > 0 && (
            <span className="text-[10px] bg-emerald-950/40 border border-emerald-700/40 text-emerald-300 rounded-full px-2 py-0.5">
              ✓ {approvedCount} approuvé{approvedCount > 1 ? 's' : ''}
            </span>
          )}
          {changesCount > 0 && (
            <span className="text-[10px] bg-orange-950/40 border border-orange-700/40 text-orange-300 rounded-full px-2 py-0.5">
              ✎ {changesCount} modification{changesCount > 1 ? 's' : ''} demandée{changesCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        {posts.slice(0, 4).map(post => (
          <Link
            key={post.id}
            href="/validation"
            title="Traiter ce retour client dans la file de validation"
            className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-cyan-900/20 transition-colors"
          >
            {post.feedbackAction === 'approved' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            ) : (
              <Edit3 className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
            )}
            <span className="text-sm text-cyan-100/80 flex-shrink-0 font-medium">
              {post.clientEmoji} {post.clientName}
            </span>
            <span className="text-xs text-gray-500 flex-1 truncate">{post.caption.substring(0, 50)}</span>
            <span className="text-[10px] text-gray-600 flex-shrink-0">{since(post.reviewedAt)}</span>
          </Link>
        ))}
      </div>
      {posts.length > 4 && (
        <Link href="/validation" className="block mt-2 text-[11px] text-cyan-400/70 hover:text-cyan-300 text-right">
          +{posts.length - 4} autre{posts.length - 4 > 1 ? 's' : ''} dans la file →
        </Link>
      )}
    </div>
  )
}
