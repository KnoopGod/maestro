'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, Loader2 } from 'lucide-react'
import type { PostInsights } from '@/types/post'

export function FetchInsightsButton({ postId }: { postId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [insights, setInsights] = useState<PostInsights[] | null>(null)

  async function fetchInsights() {
    setLoading(true)
    setError('')
    setInsights(null)
    try {
      const res = await fetch(`/api/posts/${postId}/insights`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur récupération insights')
      setInsights(data.insights ?? [])
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur récupération insights')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={fetchInsights}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-700/40 text-purple-300 hover:bg-purple-900/30 text-xs disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart3 className="w-3.5 h-3.5" />}
        Récupérer insights
      </button>
      {error && <div className="text-xs text-red-300">{error}</div>}
      {insights && (
        <div className="text-xs text-emerald-300">
          {insights.length} métrique{insights.length > 1 ? 's' : ''} récupérée{insights.length > 1 ? 's' : ''}.
        </div>
      )}
    </div>
  )
}
