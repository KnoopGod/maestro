'use client'
import { createContext, useContext, useState, useCallback, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, CheckCircle2, RotateCcw, Loader2, X } from 'lucide-react'

// ── Context ────────────────────────────────────────────────────────────────

interface BulkSelectionCtx {
  selected: Set<string>
  toggle: (id: string) => void
  clear: () => void
  isSelected: (id: string) => boolean
}

const BulkCtx = createContext<BulkSelectionCtx | null>(null)

export function BulkSelectionProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const clear = useCallback(() => setSelected(new Set()), [])
  const isSelected = useCallback((id: string) => selected.has(id), [selected])

  return (
    <BulkCtx.Provider value={{ selected, toggle, clear, isSelected }}>
      {children}
    </BulkCtx.Provider>
  )
}

function useBulk() {
  const ctx = useContext(BulkCtx)
  if (!ctx) throw new Error('useBulk must be used inside BulkSelectionProvider')
  return ctx
}

// ── Post checkbox ───────────────────────────────────────────────────────────

export function PostSelectCheckbox({ postId }: { postId: string }) {
  const { isSelected, toggle } = useBulk()
  const checked = isSelected(postId)
  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); toggle(postId) }}
      aria-label={checked ? 'Désélectionner ce post' : 'Sélectionner ce post'}
      title={checked ? 'Désélectionner' : 'Sélectionner pour action groupée'}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
        checked
          ? 'bg-indigo-600 border-indigo-600 text-white'
          : 'border-gray-600 hover:border-indigo-500 bg-transparent'
      }`}
    >
      {checked && <span className="text-[10px] font-bold leading-none">✓</span>}
    </button>
  )
}

// ── Floating action bar ─────────────────────────────────────────────────────

type BulkAction = 'delete' | 'mark-ready' | 'mark-draft'

interface BulkActionBarProps {
  postStatuses: Record<string, string>
}

export function BulkActionBar({ postStatuses }: BulkActionBarProps) {
  const { selected, clear } = useBulk()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  if (selected.size === 0) return null

  const ids = Array.from(selected)
  const statuses = ids.map(id => postStatuses[id]).filter(Boolean)
  const allDraftOrFailed = statuses.every(s => s === 'draft' || s === 'failed')
  const allReady = statuses.every(s => s === 'ready')
  const nonePublished = statuses.every(s => s !== 'published')

  async function execute(action: BulkAction) {
    setError(null)
    startTransition(async () => {
      const res = await fetch('/api/posts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok && res.status !== 207) {
        setError((data as { error?: string }).error ?? 'Erreur')
        return
      }
      clear()
      router.refresh()
    })
  }

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-gray-900 border border-indigo-700/50 rounded-2xl shadow-2xl px-4 py-3">
      <span className="text-sm font-medium text-white mr-1 whitespace-nowrap">
        {selected.size} sélectionné{selected.size > 1 ? 's' : ''}
      </span>

      {allDraftOrFailed && (
        <button
          type="button"
          onClick={() => execute('mark-ready')}
          disabled={isPending}
          title="Passer les posts sélectionnés en statut Prêt"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-medium transition-colors"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          Marquer prêts
        </button>
      )}

      {allReady && (
        <button
          type="button"
          onClick={() => execute('mark-draft')}
          disabled={isPending}
          title="Repasser les posts sélectionnés en brouillon"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-medium transition-colors"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
          Remettre en brouillon
        </button>
      )}

      {nonePublished && (
        <button
          type="button"
          onClick={() => execute('delete')}
          disabled={isPending}
          title="Supprimer les posts sélectionnés"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-40 text-white text-xs font-medium transition-colors"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          Supprimer
        </button>
      )}

      <button
        type="button"
        onClick={clear}
        title="Annuler la sélection"
        className="p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {error && (
        <span className="text-xs text-red-400 max-w-[160px] truncate">{error}</span>
      )}
    </div>
  )
}
