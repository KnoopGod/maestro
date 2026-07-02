'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCw, Trash2 } from 'lucide-react'
import type { Campaign, CampaignStatus } from '@/types/campaign'
import { CAMPAIGN_STATUS } from '@/types/campaign'

/** Barre d'actions campagne : changement de statut, régénération du plan, suppression. */
export function CampaignActions({ campaign }: { campaign: Campaign }) {
  const router = useRouter()
  const [busy, setBusy] = useState<'status' | 'regenerate' | 'delete' | null>(null)
  const [error, setError] = useState('')
  const [confirmRegen, setConfirmRegen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function patch(body: Record<string, unknown>, kind: 'status' | 'regenerate') {
    setBusy(kind)
    setError('')
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setBusy(null)
      setConfirmRegen(false)
    }
  }

  async function remove() {
    setBusy('delete')
    setError('')
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erreur suppression')
      }
      router.push('/campaigns')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur suppression')
      setBusy(null)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={campaign.status}
          onChange={e => patch({ status: e.target.value as CampaignStatus }, 'status')}
          disabled={!!busy}
          title="Changer le statut de la campagne"
          className="bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-[#E0E3FF] focus:outline-none focus:border-purple-500 hover:border-gray-700 transition-all duration-150 disabled:opacity-40"
        >
          {(Object.keys(CAMPAIGN_STATUS) as CampaignStatus[]).map(s => (
            <option key={s} value={s}>{CAMPAIGN_STATUS[s].label}</option>
          ))}
        </select>

        {confirmRegen ? (
          <span className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => patch({ action: 'regenerate' }, 'regenerate')}
              disabled={!!busy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-900/30 border border-amber-700/50 text-amber-300 hover:bg-amber-900/50 text-sm transition-all duration-150 disabled:opacity-40"
            >
              {busy === 'regenerate' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Confirmer (écrase le plan)
            </button>
            <button
              type="button"
              onClick={() => setConfirmRegen(false)}
              disabled={!!busy}
              className="px-3 py-2 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 text-sm transition-all duration-150"
            >
              Annuler
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmRegen(true)}
            disabled={!!busy}
            title="Régénérer le plan média avec l'IA — le plan actuel sera remplacé"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-40"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Régénérer le plan
          </button>
        )}

        <span className="flex-1" />

        {confirmDelete ? (
          <span className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={remove}
              disabled={!!busy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-900/30 border border-red-800/50 text-red-300 hover:bg-red-900/50 text-sm transition-all duration-150 disabled:opacity-40"
            >
              {busy === 'delete' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Supprimer définitivement
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={!!busy}
              className="px-3 py-2 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 text-sm transition-all duration-150"
            >
              Annuler
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={!!busy}
            title="Supprimer cette campagne"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-transparent hover:border-red-800/50 text-gray-600 hover:text-red-300 text-sm transition-all duration-150"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {busy === 'regenerate' && (
        <p className="text-[11px] text-gray-400">Régénération en cours — environ 15 à 30 secondes…</p>
      )}
      {error && (
        <p className="text-xs text-red-300 bg-red-950/30 border border-red-700/30 rounded-lg px-3 py-2">{error}</p>
      )}
    </div>
  )
}
