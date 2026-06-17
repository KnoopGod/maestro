'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckSquare, Edit3, Eye, Loader2, Search, Trash2, X } from 'lucide-react'
import { PostActions, PostSupervisor } from '@/components/posts/PostActions'
import { DeletePostButton } from '@/components/posts/DeletePostButton'
import { PostQuickButton } from '@/components/posts/PostQuickButtons'
import type { Post } from '@/types/post'
import type { Client } from '@/types/client'

const POST_STATUS_BORDER: Record<string, string> = {
  draft: 'border-l-amber-500/70',
  ready: 'border-l-purple-500/70',
  failed: 'border-l-red-500/70',
  published: 'border-l-emerald-500/70',
}

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Brouillon', cls: 'text-amber-300 border-amber-700/40 bg-amber-950/20' },
  ready: { label: 'Prêt', cls: 'text-purple-300 border-purple-700/40 bg-purple-950/20' },
  failed: { label: 'Échec', cls: 'text-red-300 border-red-700/40 bg-red-950/20' },
  published: { label: 'Publié', cls: 'text-emerald-300 border-emerald-700/40 bg-emerald-950/20' },
}

export function ValidationPostQueue({
  posts,
  clients,
}: {
  posts: Post[]
  clients: Client[]
}) {
  const router = useRouter()
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [clientFilter, setClientFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sort, setSort] = useState<'created-desc' | 'impact-desc' | 'impact-asc'>('created-desc')

  const clientsMap = useMemo(() => new Map(clients.map(client => [client.id, client])), [clients])
  const visiblePosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return posts
      .filter(post => clientFilter === 'all' || post.clientId === clientFilter)
      .filter(post => statusFilter === 'all' || post.status === statusFilter)
      .filter(post => {
        if (!normalizedQuery) return true
        const client = clientsMap.get(post.clientId)
        const haystack = [
          post.brief,
          post.caption,
          post.hashtags.join(' '),
          post.error ?? '',
          client?.name ?? '',
        ].join(' ').toLowerCase()
        return haystack.includes(normalizedQuery)
      })
      .sort((a, b) => {
        if (sort === 'impact-desc') return b.impactScore - a.impactScore
        if (sort === 'impact-asc') return a.impactScore - b.impactScore
        return b.createdAt - a.createdAt
      })
  }, [clientFilter, clientsMap, posts, query, sort, statusFilter])
  const selectedPosts = visiblePosts.filter(post => selectedIds.includes(post.id))

  function toggleSelectionMode() {
    setSelectionMode(prev => !prev)
    setSelectedIds([])
    setConfirmBulkDelete(false)
    setError('')
  }

  function togglePost(id: string, selected: boolean) {
    setSelectedIds(prev => selected ? [...new Set([...prev, id])] : prev.filter(item => item !== id))
  }

  function selectAll() {
    setSelectedIds(visiblePosts.map(post => post.id))
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
      const res = await fetch('/api/posts', {
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-800 bg-gray-900/30 p-3">
        <div className="text-sm text-gray-400">
          {selectionMode
            ? `${selectedIds.length} post${selectedIds.length > 1 ? 's' : ''} sélectionné${selectedIds.length > 1 ? 's' : ''}`
            : `${visiblePosts.length} / ${posts.length} post${posts.length > 1 ? 's' : ''} à traiter`}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectionMode && (
            <>
              <button
                type="button"
                onClick={selectAll}
                title="Sélectionner tous les posts visibles dans la file de validation"
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-gray-800"
              >
                <CheckSquare className="h-3.5 w-3.5" />
                Tout sélectionner
              </button>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmBulkDelete(true)}
                  title={`Supprimer ${selectedIds.length} post${selectedIds.length > 1 ? 's' : ''} sélectionné${selectedIds.length > 1 ? 's' : ''}`}
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
            title={selectionMode ? 'Quitter le mode sélection multiple' : 'Sélectionner plusieurs posts pour une action groupée'}
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

      <div className="grid gap-2 rounded-2xl border border-gray-800 bg-gray-900/30 p-3 md:grid-cols-[1fr_180px_150px_150px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Rechercher un client, brief, caption ou hashtag..."
            title="Filtrer la file de validation sans recharger la page"
            className="h-10 w-full rounded-lg border border-gray-800 bg-gray-950 pl-9 pr-3 text-sm text-gray-200 outline-none transition-colors placeholder:text-gray-600 focus:border-purple-700"
          />
        </label>
        <select
          value={clientFilter}
          onChange={event => setClientFilter(event.target.value)}
          title="Afficher uniquement les posts d'un client"
          className="h-10 rounded-lg border border-gray-800 bg-gray-950 px-3 text-sm text-gray-200 outline-none focus:border-purple-700"
        >
          <option value="all">Tous les clients</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value)}
          title="Filtrer par statut de validation"
          className="h-10 rounded-lg border border-gray-800 bg-gray-950 px-3 text-sm text-gray-200 outline-none focus:border-purple-700"
        >
          <option value="all">Tous statuts</option>
          <option value="draft">Brouillons</option>
          <option value="ready">Prêts</option>
          <option value="failed">Échecs</option>
        </select>
        <select
          value={sort}
          onChange={event => setSort(event.target.value as typeof sort)}
          title="Changer l'ordre d'affichage"
          className="h-10 rounded-lg border border-gray-800 bg-gray-950 px-3 text-sm text-gray-200 outline-none focus:border-purple-700"
        >
          <option value="created-desc">Plus récents</option>
          <option value="impact-desc">Impact fort</option>
          <option value="impact-asc">Impact faible</option>
        </select>
      </div>

      {visiblePosts.length === 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900/30 p-6 text-center text-sm text-gray-500">
          Aucun post ne correspond aux filtres actuels.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visiblePosts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            client={clientsMap.get(post.clientId)}
            selectionMode={selectionMode}
            selected={selectedIds.includes(post.id)}
            onSelectedChange={selected => togglePost(post.id, selected)}
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
            <h3 className="font-semibold text-white">Supprimer plusieurs posts ?</h3>
            <p className="mt-2 text-sm text-gray-400">
              {selectedPosts.length} post{selectedPosts.length > 1 ? 's' : ''} seront supprimés définitivement de la file de validation.
            </p>
            <div className="mt-3 max-h-32 overflow-y-auto rounded-lg border border-gray-800 bg-gray-950/50 p-2 text-xs text-gray-300">
              {selectedPosts.map(post => <div key={post.id}>{post.brief}</div>)}
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

function PostCard({
  post,
  client,
  selectionMode,
  selected,
  onSelectedChange,
}: {
  post: Post
  client: Client | undefined
  selectionMode: boolean
  selected: boolean
  onSelectedChange: (selected: boolean) => void
}) {
  const leftBorder = POST_STATUS_BORDER[post.status] ?? ''
  return (
    <article className={`relative bg-gray-900/40 border border-l-2 ${leftBorder} border-gray-800 rounded-2xl p-5 space-y-4 transition-colors duration-200 ${selected ? 'ring-2 ring-purple-500/60' : ''}`}>
      {selectionMode && (
        <label className="absolute right-4 top-4 z-10 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-700 bg-gray-950/90 px-2.5 py-1.5 text-xs text-gray-200 shadow-lg">
          <input
            type="checkbox"
            checked={selected}
            onChange={event => onSelectedChange(event.target.checked)}
            className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-purple-500 focus:ring-purple-500"
          />
          Sélectionner
        </label>
      )}

      <div className="flex items-start gap-3 pr-0">
        {post.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.imageUrl} alt="" loading="lazy" decoding="async" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className={`w-20 h-20 rounded-lg bg-gradient-to-br ${client?.color ?? 'from-gray-700 to-gray-900'} flex items-center justify-center text-2xl flex-shrink-0`}>
            {client?.emoji ?? '📝'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {client && (
              <Link href={`/clients/${client.id}`} className="text-xs text-purple-300 hover:underline">
                {client.emoji} {client.name}
              </Link>
            )}
            <StatusPill status={post.status} />
            <span className="text-[10px] text-gray-600 ml-auto">Impact {post.impactScore}/100</span>
          </div>
          <p className="text-sm font-medium text-white line-clamp-2">{post.brief}</p>
        </div>
      </div>

      <p className="text-sm text-gray-300 line-clamp-4 leading-snug">{post.caption}</p>

      {post.hashtags.length > 0 && (
        <p className="text-[11px] text-blue-400 line-clamp-1">
          {post.hashtags.slice(0, 6).map(h => `#${h.replace(/^#/, '')}`).join(' ')}
        </p>
      )}

      {post.status === 'failed' && post.error && (
        <div className="text-xs text-red-300 bg-red-950/30 border border-red-700/30 rounded-lg p-2 flex gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{post.error}</span>
        </div>
      )}

      <PostSupervisor post={post} />
      <div className="flex flex-wrap justify-end gap-2">
        {!selectionMode && <DeletePostButton postId={post.id} />}
        {!selectionMode && post.status === 'draft' && <PostQuickButton postId={post.id} action="mark-ready" />}
        {!selectionMode && post.status === 'failed' && <PostQuickButton postId={post.id} action="reset" />}
        {!selectionMode && <PostQuickButton postId={post.id} action="duplicate" redirectToPost />}
        <Link
          href={`/posts/${post.id}?from=validation`}
          title="Ouvrir la fiche complète du post avec contexte, feedback client, métriques et actions"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm transition-colors"
        >
          <Eye className="w-3.5 h-3.5" />
          Détail
        </Link>
        <Link
          href={`/studio?postId=${post.id}`}
          title="Ouvrir ce draft dans le Studio pour modifier le brief, le texte ou le visuel avant publication"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm transition-colors"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Modifier dans Studio
        </Link>
      </div>
      <PostActions post={post} />
    </article>
  )
}

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_PILL[status] ?? { label: status, cls: 'text-gray-400 border-gray-700 bg-gray-800/20' }
  return (
    <span title={`Statut du post : ${cfg.label}`} className={`text-[10px] border rounded-full px-2 py-0.5 ${cfg.cls}`}>{cfg.label}</span>
  )
}
