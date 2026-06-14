'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Post } from '@/types/post'

export function PortalReviewCard({ post, token }: { post: Post; token: string }) {
  const router = useRouter()
  const [comment, setComment] = useState('')
  const [showComment, setShowComment] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit(action: 'approved' | 'changes_requested') {
    startTransition(async () => {
      setError(null)
      const res = await fetch(`/api/portal/${token}/posts/${post.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comment: comment.trim() || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? 'Erreur inattendue')
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
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex gap-4 p-4">
        {post.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.imageUrl}
            alt=""
            className="h-24 w-24 flex-shrink-0 rounded-lg border border-gray-100 object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-3 text-sm leading-relaxed text-gray-800">{post.caption}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
            <span className="capitalize">{post.platforms.join(' + ')}</span>
            <span>{dateStr}</span>
          </div>
        </div>
      </div>

      {showComment && (
        <div className="px-4 pb-3">
          <textarea
            value={comment}
            onChange={event => setComment(event.target.value)}
            placeholder="Précisez les modifications souhaitées (optionnel)..."
            maxLength={1000}
            rows={3}
            className="w-full resize-none rounded-lg border border-gray-200 p-2.5 text-sm text-gray-700 outline-none focus:border-orange-400"
          />
        </div>
      )}

      {error && <p className="px-4 pb-2 text-xs text-red-500">{error}</p>}

      <div className="flex gap-2 px-4 pb-4">
        <button
          type="button"
          disabled={isPending}
          onClick={() => submit('approved')}
          className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
        >
          {isPending ? '...' : 'Approuver'}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (!showComment) {
              setShowComment(true)
              return
            }
            submit('changes_requested')
          }}
          className="flex-1 rounded-lg bg-orange-500 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
        >
          {isPending ? '...' : showComment ? 'Envoyer' : 'Demander des modifications'}
        </button>
      </div>
    </div>
  )
}
