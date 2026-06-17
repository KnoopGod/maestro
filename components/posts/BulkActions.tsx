'use client'
import { createContext, useContext, useState, useCallback, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, CheckCircle2, RotateCcw, Loader2, X, CalendarClock } from 'lucide-react'

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

type BulkAction = 'delete' | 'mark-ready' | 'mark-draft' | 'schedule'

interface BulkActionBarProps {
  postStatuses: Record<string, string>
}

/** Returns N timestamps spaced by intervalMs starting from startMs. */
function spreadSchedule(startMs: number, count: number, intervalMs = 10 * 60 * 1000): number[] {
  return Array.from({ length: count }, (_, i) => startMs + i * intervalMs)
}

function nextDayAt(hour: number): number {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(hour, 0, 0, 0)
  return d.getTime()
}

export function BulkActionBar({ postStatuses }: BulkActionBarProps) {
  const { selected, clear } = useBulk()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showCustom, setShowCustom] = useState(false)
  const [customDate, setCustomDate] = useState('')

  if (selected.size === 0) return null

  const ids = Array.from(selected)
  const statuses = ids.map(id => postStatuses[id]).filter(Boolean)
  const allDraftOrFailed = statuses.every(s => s === 'draft' || s === 'failed')
  const allReady = statuses.every(s => s === 'ready')
  const nonePublished = statuses.every(s => s !== 'published')
  const canSchedule = nonePublished

  async function execute(action: BulkAction, scheduledAts?: number[]) {
    setError(null)
    startTransition(async () => {
      const res = await fetch('/api/posts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, action, scheduledAts }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok && res.status !== 207) {
        setError((data as { error?: string }).error ?? 'Erreur')
        return
      }
      clear()
      setShowCustom(false)
      router.refresh()
    })
  }

  function scheduleAt(startMs: number) {
    execute('schedule', spreadSchedule(startMs, ids.length))
  }

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 border border-indigo-700/50 rounded-2xl shadow-2xl">
      <div className="flex items-center gap-2 px-4 py-3">
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

        {canSchedule && (
          <button
            type="button"
            onClick={() => setShowCustom(v => !v)}
            disabled={isPending}
            title="Planifier les posts sélectionnés"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors disabled:opacity-40 ${
              showCustom ? 'bg-blue-700 border-blue-600 text-white' : 'border-blue-700/50 text-blue-300 hover:bg-blue-900/30'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5" />
            Planifier
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

      {showCustom && (
        <div className="border-t border-gray-800 px-4 py-3 space-y-2">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">
            {ids.length > 1 ? `${ids.length} posts espacés de 10 min` : 'Planifier à'}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => scheduleAt(nextDayAt(10))}
              disabled={isPending}
              className="text-xs px-2.5 py-1 rounded border border-blue-700/50 text-blue-300 hover:bg-blue-900/30 transition-colors disabled:opacity-40"
            >
              Demain 10h
            </button>
            <button
              type="button"
              onClick={() => scheduleAt(nextDayAt(12))}
              disabled={isPending}
              className="text-xs px-2.5 py-1 rounded border border-blue-700/50 text-blue-300 hover:bg-blue-900/30 transition-colors disabled:opacity-40"
            >
              Demain 12h
            </button>
            <button
              type="button"
              onClick={() => scheduleAt(nextDayAt(19))}
              disabled={isPending}
              className="text-xs px-2.5 py-1 rounded border border-blue-700/50 text-blue-300 hover:bg-blue-900/30 transition-colors disabled:opacity-40"
            >
              Demain 19h
            </button>
            <div className="flex items-center gap-1.5">
              <input
                type="datetime-local"
                value={customDate}
                onChange={e => setCustomDate(e.target.value)}
                className="text-xs px-2 py-1 rounded bg-gray-950 border border-gray-700 text-gray-200 focus:outline-none focus:border-blue-600"
              />
              <button
                type="button"
                onClick={() => { if (customDate) scheduleAt(new Date(customDate).getTime()) }}
                disabled={!customDate || isPending}
                className="text-xs px-2.5 py-1 rounded bg-blue-700 text-white hover:bg-blue-600 transition-colors disabled:opacity-40"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
