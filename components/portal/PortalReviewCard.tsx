'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Post } from '@/types/post'

interface Props {
  post: Post
  token: string
}

export function PortalReviewCard({ post, token }: Props) {
  const router = useRouter()
  const [comment, setComment] = useState('')
  const [showComment, setShowComment] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const submit = (action: 'approved' | 'changes_requested') => {
    startTransition(async () => {
      setError(null)
      const res = await fetch(
        `/api/portal/${token}/posts/${post.id}/review`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, comment: comment.trim() || undefined }),
        }
      )
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError((d as { error?: string }).error ?? 'Erreur inattendue')
        return
      }
      router.refresh()
    })
  }

  const dateStr = new Date(post.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="flex gap-4 p-4">
        {post.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.imageUrl}
            alt=""
            className="w-24 h-24 rounded-lg object-cover flex-shrink-0 border border-gray-100"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 leading-relaxed line-clamp-3">{post.caption}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-xs text-gray-400">
            <span className="capitalize">{post.platforms.join(' + ')}</span>
            <span>{dateStr}</span>
          </div>
        </div>
      </div>

      {showComment && (
        <div className="px-4 pb-3">
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Précisez les modifications souhaitées (optionnel)…"
            maxLength={1000}
            rows={3}
            className="w-full text-sm border border-gray-200 rounded-lg p-2.5 resize-none outline-none focus:border-orange-400 text-gray-700"
          />
        </div>
      )}

      {error && (
        <p className="px-4 pb-2 text-xs text-red-500">{error}</p>
      )}

      <div className="flex gap-2 px-4 pb-4">
        <button
          type="button"
          disabled={isPending}
          onClick={() => submit('approved')}
          className="flex-1 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {isPending ? '…' : '✓ Approuver'}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (!showComment) { setShowComment(true); return }
            submit('changes_requested')
          }}
          className="flex-1 py-2 text-sm font-medium rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {isPending ? '…' : showComment ? 'Envoyer' : '✎ Demander des modifications'}
        </button>
      </div>
    </div>
  )
}
