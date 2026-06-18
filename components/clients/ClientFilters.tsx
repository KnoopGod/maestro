'use client'

import Link from 'next/link'
import { CheckSquare, Plus, Trash2, X } from 'lucide-react'
import { useMemo, useState, useTransition } from 'react'
import { CLIENT_TYPES, CLIENT_STATUS, type ClientType, type ClientStatus, type ClientWithStats } from '@/types/client'
import { ClientCard } from './ClientCard'
import { deleteClientsAction } from '@/lib/actions/clients'

type Filter = 'all' | ClientType
type StatusFilter = 'all' | ClientStatus

export function ClientGridWithFilters({
  clients,
  filter = 'all',
  statusFilter = 'all',
}: {
  clients: ClientWithStats[]
  filter?: Filter
  statusFilter?: StatusFilter
}) {
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  const counts: Record<Filter, number> = {
    all: clients.length,
    restaurant: clients.filter(c => c.type === 'restaurant').length,
    hotel: clients.filter(c => c.type === 'hotel').length,
    bar: clients.filter(c => c.type === 'bar').length,
    bnb: clients.filter(c => c.type === 'bnb').length,
    restaurant_hotel: clients.filter(c => c.type === 'restaurant_hotel').length,
  }

  const statusCounts: Record<StatusFilter, number> = {
    all: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    paused: clients.filter(c => c.status === 'paused').length,
    archived: clients.filter(c => c.status === 'archived').length,
  }

  const filtered = useMemo(
    () => clients
      .filter(c => filter === 'all' || c.type === filter)
      .filter(c => statusFilter === 'all' || c.status === statusFilter),
    [clients, filter, statusFilter]
  )
  const selectedClients = clients.filter(c => selectedIds.includes(c.id))

  const toggleSelectionMode = () => {
    setSelectionMode(prev => !prev)
    setSelectedIds([])
    setConfirmBulkDelete(false)
  }

  const toggleClient = (id: string, selected: boolean) => {
    setSelectedIds(prev => selected ? [...new Set([...prev, id])] : prev.filter(item => item !== id))
  }

  const selectVisible = () => {
    setSelectedIds(prev => [...new Set([...prev, ...filtered.map(c => c.id)])])
  }

  const clearSelection = () => {
    setSelectedIds([])
    setConfirmBulkDelete(false)
  }

  const deleteSelected = () => {
    startTransition(async () => {
      await deleteClientsAction(selectedIds)
      setSelectedIds([])
      setConfirmBulkDelete(false)
      setSelectionMode(false)
    })
  }

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-5 text-center">
        <div className="text-5xl">🏢</div>
        <div>
          <p className="text-lg font-medium text-white">Aucun client pour l&apos;instant</p>
          <p className="text-sm text-gray-500 mt-1 max-w-xs">Commencez par ajouter votre premier établissement HORECA pour générer du contenu avec les agents IA.</p>
        </div>
        <Link
          href="/clients/new"
          title="Créer le premier profil client HORECA"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Créer mon premier client
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Link
            href={statusFilter === 'all' ? '/clients' : `/clients?status=${statusFilter}`}
            title="Afficher tous les types de clients"
            className={`text-xs px-3 py-2 min-h-[36px] rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-900 border border-gray-800 text-gray-400 hover:bg-gray-800'
            }`}
          >
            Tous ({counts.all})
          </Link>
          {(Object.keys(CLIENT_TYPES) as ClientType[]).filter(t => counts[t] > 0).map(t => {
            const cfg = CLIENT_TYPES[t]
            const active = filter === t
            const href = ['/clients', new URLSearchParams({ type: t, ...(statusFilter !== 'all' ? { status: statusFilter } : {}) }).toString()].filter(Boolean).join('?')
            return (
              <Link
                key={t}
                href={href}
                title={`Afficher uniquement les clients de type ${cfg.label}`}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                  active
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-900 border border-gray-800 text-gray-400 hover:bg-gray-800'
                }`}
              >
                <span>{cfg.emoji}</span>
                {cfg.label} ({counts[t]})
              </Link>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectionMode && (
            <>
              <button
                type="button"
                onClick={selectVisible}
                title="Sélectionner tous les clients actuellement visibles"
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-gray-800"
              >
                <CheckSquare className="h-3.5 w-3.5" />
                Tout sélectionner
              </button>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmBulkDelete(true)}
                  title={`Supprimer ${selectedIds.length} client${selectedIds.length > 1 ? 's' : ''} sélectionné${selectedIds.length > 1 ? 's' : ''}`}
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
            onClick={selectionMode ? toggleSelectionMode : () => setSelectionMode(true)}
            title={selectionMode ? 'Quitter le mode sélection multiple' : 'Sélectionner plusieurs clients pour une action groupée'}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-gray-800"
          >
            {selectionMode ? <X className="h-3.5 w-3.5" /> : <CheckSquare className="h-3.5 w-3.5" />}
            {selectionMode ? 'Annuler' : 'Sélection multiple'}
          </button>
        </div>
        </div>

        {/* Status filter */}
        {Object.values(statusCounts).some((n, i) => i > 0 && n > 0) && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 mr-1">Statut</span>
            <Link
              href={filter === 'all' ? '/clients' : `/clients?type=${filter}`}
              title="Afficher tous les statuts"
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                statusFilter === 'all'
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              Tous ({statusCounts.all})
            </Link>
            {(Object.keys(CLIENT_STATUS) as ClientStatus[]).filter(s => statusCounts[s] > 0).map(s => {
              const cfg = CLIENT_STATUS[s]
              const href = ['/clients', new URLSearchParams({ status: s, ...(filter !== 'all' ? { type: filter } : {}) }).toString()].filter(Boolean).join('?')
              return (
                <Link
                  key={s}
                  href={href}
                  title={`Filtrer les clients ${cfg.label.toLowerCase()}`}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    statusFilter === s
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {cfg.label} ({statusCounts[s]})
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/20 border border-dashed border-gray-800 rounded-2xl">
          <p className="text-gray-500">Aucun client dans cette catégorie.</p>
          <Link href="/clients" title="Effacer tous les filtres" className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover:underline mt-2">
            Voir tous les clients →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <ClientCard
              key={c.id}
              client={c}
              selectionMode={selectionMode}
              selected={selectedIds.includes(c.id)}
              onSelectedChange={selected => toggleClient(c.id, selected)}
            />
          ))}
        </div>
      )}

      {confirmBulkDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Fermer la confirmation"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setConfirmBulkDelete(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-red-700/30 bg-gray-900 p-6 shadow-2xl">
            <h3 className="font-semibold text-white">Supprimer plusieurs clients ?</h3>
            <p className="mt-2 text-sm text-gray-400">
              {selectedClients.length} client{selectedClients.length > 1 ? 's' : ''} seront supprimés définitivement avec leur historique local.
            </p>
            <div className="mt-3 max-h-32 overflow-y-auto rounded-lg border border-gray-800 bg-gray-950/50 p-2 text-xs text-gray-300">
              {selectedClients.map(c => <div key={c.id}>{c.name}</div>)}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={clearSelection}
                disabled={isPending}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={deleteSelected}
                disabled={isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {isPending ? 'Suppression...' : 'Supprimer la sélection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
