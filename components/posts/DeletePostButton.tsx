'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trash2 } from 'lucide-react'

export function DeletePostButton({
  postId,
  label = 'Supprimer',
}: {
  postId: string
  label?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function deletePost() {
    const confirmed = window.confirm('Supprimer définitivement ce post de la file de validation ?')
    if (!confirmed) return

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur suppression')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur suppression')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={deletePost}
        disabled={loading}
        title="Supprimer définitivement ce draft de validation"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-800/50 text-red-300 hover:bg-red-950/30 text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
        {label}
      </button>
      {error && <p className="text-[11px] text-red-300">{error}</p>}
    </div>
  )
}
