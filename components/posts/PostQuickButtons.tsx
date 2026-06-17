'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Copy, Loader2, RotateCcw } from 'lucide-react'

type Action = 'duplicate' | 'mark-ready' | 'reset'

const ACTION_CFG: Record<Action, {
  label: string
  loading: string
  path: string
  icon: typeof Copy
  className: string
}> = {
  duplicate: {
    label: 'Dupliquer',
    loading: 'Copie...',
    path: 'duplicate',
    icon: Copy,
    className: 'border-gray-700 text-gray-300 hover:bg-gray-800',
  },
  'mark-ready': {
    label: 'Marquer prêt',
    loading: 'Validation...',
    path: 'mark-ready',
    icon: CheckCircle2,
    className: 'border-purple-700/50 text-purple-300 hover:bg-purple-950/30',
  },
  reset: {
    label: 'Remettre en brouillon',
    loading: 'Réinitialisation...',
    path: 'reset',
    icon: RotateCcw,
    className: 'border-amber-700/50 text-amber-300 hover:bg-amber-950/30',
  },
}

export function PostQuickButton({
  postId,
  action,
  redirectToPost = false,
}: {
  postId: string
  action: Action
  redirectToPost?: boolean
}) {
  const router = useRouter()
  const cfg = ACTION_CFG[action]
  const Icon = cfg.icon
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function run() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/posts/${postId}/${cfg.path}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      if (redirectToPost && data.post?.id) {
        router.push(`/posts/${data.post.id}`)
        return
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={run}
        disabled={loading}
        title={cfg.label}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${cfg.className}`}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
        {loading ? cfg.loading : cfg.label}
      </button>
      {error && <p className="max-w-44 text-[11px] text-red-300">{error}</p>}
    </div>
  )
}
