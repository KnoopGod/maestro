'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Loader2, Database } from 'lucide-react'

/**
 * Bandeau affiché quand une table attendue manque en production
 * (schemaAutoInit désactivé sur Turso). Le bouton applique les migrations
 * via /api/admin/migrate — autorisé par la session admin en cours.
 */
export function MigrateBanner({ context }: { context: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function migrate() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/admin/migrate', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur migration')
      setBusy(false)
    }
  }

  return (
    <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-amber-200">Base de données à mettre à jour</h2>
          <p className="text-xs text-amber-100/80 mt-1">
            {context} La structure de la base n&apos;inclut pas encore les dernières tables —
            un clic suffit pour appliquer les migrations (opération sûre, uniquement additive).
          </p>
          {error && (
            <p className="text-xs text-red-300 bg-red-950/30 border border-red-700/30 rounded-lg px-3 py-2 mt-2">{error}</p>
          )}
          <button
            type="button"
            onClick={migrate}
            disabled={busy}
            className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 active:scale-[0.98] text-white text-sm font-medium transition-all duration-150 disabled:opacity-40"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            {busy ? 'Migration en cours…' : 'Mettre à jour la base'}
          </button>
        </div>
      </div>
    </div>
  )
}
