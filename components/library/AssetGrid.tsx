'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckSquare, Loader2, Trash2, X } from 'lucide-react'
import { AssetCard } from '@/components/library/AssetCard'
import type { ClientAsset } from '@/types/asset'

export function AssetGrid({ assets, clientId }: { assets: ClientAsset[]; clientId: string }) {
  const router = useRouter()
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedAssets = assets.filter(asset => selectedIds.includes(asset.id))

  function toggleSelectionMode() {
    setSelectionMode(prev => !prev)
    setSelectedIds([])
    setConfirmBulkDelete(false)
    setError('')
  }

  function toggleAsset(id: string, selected: boolean) {
    setSelectedIds(prev => selected ? [...new Set([...prev, id])] : prev.filter(item => item !== id))
  }

  function clearSelection() {
    setSelectedIds([])
    setConfirmBulkDelete(false)
    setError('')
  }

  async function deleteSelected() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/clients/${clientId}/assets`, {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur suppression')

      setSelectedIds([])
      setConfirmBulkDelete(false)
      setSelectionMode(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur suppression')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-gray-500">
          {selectionMode
            ? `${selectedIds.length} média${selectedIds.length > 1 ? 's' : ''} sélectionné${selectedIds.length > 1 ? 's' : ''}`
            : 'Actions Library'}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectionMode && (
            <>
              <button
                type="button"
                onClick={() => setSelectedIds(assets.map(asset => asset.id))}
                title="Sélectionner tous les médias visibles"
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-gray-800"
              >
                <CheckSquare className="h-3.5 w-3.5" />
                Tout sélectionner
              </button>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmBulkDelete(true)}
                  title={`Supprimer ${selectedIds.length} média${selectedIds.length > 1 ? 's' : ''} sélectionné${selectedIds.length > 1 ? 's' : ''}`}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-red-800/50 bg-red-950/30 px-3 py-2 text-xs font-medium text-red-300 hover:bg-red-900/40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Supprimer ({selectedIds.length})
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={toggleSelectionMode}
            title={selectionMode ? 'Quitter le mode sélection multiple' : 'Sélectionner plusieurs médias pour une action groupée'}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-gray-800"
          >
            {selectionMode ? <X className="h-3.5 w-3.5" /> : <CheckSquare className="h-3.5 w-3.5" />}
            {selectionMode ? 'Annuler' : 'Sélection multiple'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-800/40 bg-red-950/20 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {assets.map(asset => (
          <AssetCard
            key={asset.id}
            asset={asset}
            selectionMode={selectionMode}
            selected={selectedIds.includes(asset.id)}
            onSelectedChange={selected => toggleAsset(asset.id, selected)}
          />
        ))}
      </div>

      {confirmBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fermer la confirmation"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setConfirmBulkDelete(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-red-700/30 bg-gray-900 p-6 shadow-2xl">
            <h3 className="font-semibold text-white">Supprimer plusieurs médias ?</h3>
            <p className="mt-2 text-sm text-gray-400">
              {selectedAssets.length} média{selectedAssets.length > 1 ? 's' : ''} seront supprimés définitivement de la Library.
            </p>
            <div className="mt-3 max-h-32 overflow-y-auto rounded-lg border border-gray-800 bg-gray-950/50 p-2 text-xs text-gray-300">
              {selectedAssets.map(asset => <div key={asset.id}>{asset.originalName}</div>)}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={clearSelection}
                disabled={loading}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={deleteSelected}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {loading ? 'Suppression...' : 'Supprimer la sélection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
