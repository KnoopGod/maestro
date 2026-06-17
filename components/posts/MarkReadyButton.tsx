'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'

export function MarkReadyButton({ postId }: { postId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function markReady() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/posts/${postId}/mark-ready`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setDone(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Prêt
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={markReady}
        disabled={loading}
        title="Marquer ce post comme prêt pour publication"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-purple-700/40 text-purple-300 hover:bg-purple-900/30 text-xs transition-colors disabled:opacity-40"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
        Marquer prêt
      </button>
      {error && <span className="text-[11px] text-red-400">{error}</span>}
    </div>
  )
}
