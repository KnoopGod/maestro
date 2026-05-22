'use client'
import { useState, useTransition } from 'react'
import { Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AnalyzeDAButton({ clientId, hasIdentity }: { clientId: string; hasIdentity: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{
    analyzed: number
    total_images: number
    cost: { total: number }
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleAnalyze = () => {
    setError(null)
    setResult(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/clients/${clientId}/analyze-da`, { method: 'POST' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur analyse')
        setResult(data)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleAnalyze}
        disabled={isPending}
        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 disabled:opacity-50 text-white text-sm font-medium flex items-center gap-2 shadow-lg shadow-purple-900/30"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyse en cours...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            {hasIdentity ? 'Mettre à jour la DA' : 'Analyser la DA'}
          </>
        )}
      </button>

      {result && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
          <CheckCircle className="w-3.5 h-3.5" />
          {result.analyzed} nouvelle{result.analyzed > 1 ? 's' : ''} image{result.analyzed > 1 ? 's' : ''} analysée{result.analyzed > 1 ? 's' : ''} · ${result.cost.total}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-400 max-w-xs text-right">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}
    </div>
  )
}
