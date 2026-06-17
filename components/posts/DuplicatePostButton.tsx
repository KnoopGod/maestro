'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Loader2 } from 'lucide-react'

export function DuplicatePostButton({ postId, className }: { postId: string; className?: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function duplicate() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/posts/${postId}/duplicate`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      router.push(`/posts/${data.post.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={duplicate}
        disabled={loading}
        title="Dupliquer ce post comme nouveau brouillon"
        className={className ?? 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600 text-xs transition-colors disabled:opacity-40'}
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
        Dupliquer
      </button>
      {error && <span className="text-[11px] text-red-400">{error}</span>}
    </div>
  )
}
