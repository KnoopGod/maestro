'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'

export function MarkAllReadyButton({ draftIds }: { draftIds: string[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  if (draftIds.length === 0) return null

  function markAll() {
    setError('')
    startTransition(async () => {
      try {
        const res = await fetch('/api/posts/bulk', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ids: draftIds, action: 'mark-ready' }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok && res.status !== 207) {
          setError((data as { error?: string }).error ?? 'Erreur')
          return
        }
        router.refresh()
      } catch {
        setError('Erreur réseau')
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={markAll}
        disabled={isPending}
        title={`Passer les ${draftIds.length} brouillon${draftIds.length > 1 ? 's' : ''} en "Prêt"`}
        className="px-3 py-2 rounded-lg border border-purple-700/50 text-purple-300 hover:bg-purple-900/30 text-sm flex items-center gap-1.5 transition-colors disabled:opacity-40"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        Marquer {draftIds.length} prêt{draftIds.length > 1 ? 's' : ''}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  )
}
