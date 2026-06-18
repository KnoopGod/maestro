'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock, Loader2, X } from 'lucide-react'

interface Props {
  postId: string
  status: string
  scheduledAt: number | null
  now: number
}

function fmt(ts: number): string {
  return new Date(ts).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function toDatetimeLocal(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function InlineSchedulePicker({ postId, status, scheduledAt, now }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(scheduledAt ? toDatetimeLocal(scheduledAt) : '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (status === 'published') {
    return scheduledAt ? <span className="text-gray-600 text-[10px]">{fmt(scheduledAt)}</span> : null
  }

  async function save() {
    if (!value) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`/api/posts/${postId}/schedule`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scheduledAt: new Date(value).getTime() }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Erreur planification')
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    if (scheduledAt) {
      const isLate = scheduledAt < now
      return (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="Modifier la date de planification"
          className={`flex items-center gap-1 text-[10px] hover:underline transition-colors ${isLate ? 'text-red-400' : 'text-blue-400'}`}
        >
          📅 {fmt(scheduledAt)}
          {isLate && <span className="text-[9px] px-1 rounded bg-red-900/40 border border-red-700/30">en retard</span>}
        </button>
      )
    }
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Planifier ce post"
        className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-blue-300 transition-colors"
      >
        <CalendarClock className="w-3 h-3" />
        Planifier
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      <input
        type="datetime-local"
        value={value}
        onChange={e => setValue(e.target.value)}
        autoFocus
        className="text-[10px] px-1.5 py-0.5 rounded bg-gray-950 border border-blue-700/50 text-gray-200 focus:outline-none focus:border-blue-500"
      />
      <button
        type="button"
        onClick={save}
        disabled={!value || busy}
        title="Confirmer la planification"
        className="text-[10px] px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 flex items-center gap-1"
      >
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : 'OK'}
      </button>
      <button
        type="button"
        onClick={() => { setOpen(false); setError('') }}
        title="Annuler"
        className="text-[10px] text-gray-500 hover:text-gray-300"
      >
        <X className="w-3 h-3" />
      </button>
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </div>
  )
}
