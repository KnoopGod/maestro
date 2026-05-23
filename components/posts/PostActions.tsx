'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, CalendarClock, Send, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import type { Post, SupervisorReview } from '@/types/post'

interface PostActionsProps {
  post: Post
  /** Refresh the parent server component after a mutation. */
  refresh?: boolean
}

export function PostActions({ post, refresh = true }: PostActionsProps) {
  const router = useRouter()
  const [status, setStatus] = useState(post.status)
  const [scheduledAt, setScheduledAt] = useState<string>(
    post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : ''
  )
  const [busy, setBusy] = useState<'schedule' | 'publish' | 'unschedule' | null>(null)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')

  async function schedule() {
    if (!scheduledAt) return
    setBusy('schedule')
    setError('')
    try {
      const res = await fetch(`/api/posts/${post.id}/schedule`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scheduledAt: new Date(scheduledAt).getTime() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur planification')
      setStatus(data.post.status)
      if (refresh) router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur planification')
    } finally {
      setBusy(null)
    }
  }

  async function unschedule() {
    setBusy('unschedule')
    setError('')
    try {
      const res = await fetch(`/api/posts/${post.id}/schedule`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setStatus(data.post.status)
      setScheduledAt('')
      if (refresh) router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setBusy(null)
    }
  }

  async function publishNow() {
    setBusy('publish')
    setError('')
    setWarning('')
    try {
      const res = await fetch('/api/studio/publish-post', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ postId: post.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur publication')
      setStatus(data.post.status)
      if (Array.isArray(data.warnings) && data.warnings.length > 0) {
        setWarning(data.warnings.join(' '))
      }
      if (refresh) router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur publication')
    } finally {
      setBusy(null)
    }
  }

  const isPublished = status === 'published'
  const isScheduled = status === 'scheduled'

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">
            Planification
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
            disabled={isPublished}
            className="w-full px-2.5 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-sm text-gray-200 focus:border-purple-600 focus:outline-none disabled:opacity-50"
          />
        </div>

        <button
          onClick={schedule}
          disabled={!scheduledAt || !!busy || isPublished}
          className="px-3 py-1.5 rounded-lg border border-blue-700/50 text-blue-300 hover:bg-blue-900/30 text-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy === 'schedule' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarClock className="w-3.5 h-3.5" />}
          {isScheduled ? 'Reporter' : 'Planifier'}
        </button>

        {isScheduled && (
          <button
            onClick={unschedule}
            disabled={!!busy}
            className="px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 text-sm disabled:opacity-40"
          >
            {busy === 'unschedule' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Annuler'}
          </button>
        )}

        <button
          onClick={publishNow}
          disabled={!!busy || isPublished}
          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium flex items-center gap-1.5 disabled:opacity-40"
        >
          {busy === 'publish' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Publier maintenant
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-300 bg-red-950/30 border border-red-700/30 rounded-lg p-2 flex gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {warning && (
        <div className="text-xs text-amber-300 bg-amber-950/30 border border-amber-700/30 rounded-lg p-2 flex gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{warning}</span>
        </div>
      )}
    </div>
  )
}

export function PostSupervisor({ post }: { post: Post }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [review, setReview] = useState<SupervisorReview | null>(post.supervisorReview)
  const [error, setError] = useState('')

  async function supervise() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/posts/${post.id}/supervise`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur supervision')
      setReview(data.review)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur supervision')
    } finally {
      setLoading(false)
    }
  }

  const verdictColor =
    review?.verdict === 'ready' ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40' :
    review?.verdict === 'blocked' ? 'bg-red-900/40 text-red-300 border-red-700/40' :
    review?.verdict === 'revise' ? 'bg-amber-900/40 text-amber-300 border-amber-700/40' :
    'bg-gray-800 text-gray-400 border-gray-700'

  return (
    <div className="bg-gray-950/40 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-white">Claude Supervisor</span>
          {review && (
            <>
              <span className={`text-[10px] border rounded-full px-2 py-0.5 ${verdictColor}`}>{review.verdict}</span>
              <span className="text-[10px] text-gray-500">{review.score}/100</span>
            </>
          )}
        </div>
        <button
          onClick={supervise}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg border border-purple-700/40 text-purple-300 hover:bg-purple-900/30 text-xs flex items-center gap-1.5 disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {review ? 'Re-superviser' : 'Demander supervision'}
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-300 bg-red-950/30 border border-red-700/30 rounded-lg p-2">{error}</div>
      )}

      {review && (
        <div className="space-y-3 text-sm text-gray-300">
          <p className="italic text-gray-300">{review.summary}</p>
          {review.risks.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-red-400 mb-1">⚠️ Risques</div>
              <ul className="space-y-1">
                {review.risks.map(r => (
                  <li key={r} className="text-xs text-red-300/90 bg-red-950/20 border border-red-700/20 rounded px-2 py-1">{r}</li>
                ))}
              </ul>
            </div>
          )}
          {review.improvements.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-purple-400 mb-1">💡 Améliorations</div>
              <ul className="space-y-1">
                {review.improvements.map(r => (
                  <li key={r} className="text-xs text-purple-300/90 bg-purple-950/20 border border-purple-700/20 rounded px-2 py-1">{r}</li>
                ))}
              </ul>
            </div>
          )}
          {review.nextAction && (
            <div className="bg-purple-950/30 border border-purple-700/30 rounded-lg p-2 text-xs text-purple-200">
              <span className="font-medium">Prochaine action :</span> {review.nextAction}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function PublishDueButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ count: number; message: string } | null>(null)
  const [error, setError] = useState('')

  async function publishDue() {
    setLoading(true)
    setResult(null)
    setError('')
    try {
      const res = await fetch('/api/cron/publish-due', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur cron')
      const ok = data.results?.filter((r: { status: string }) => r.status === 'published').length || 0
      const failed = data.results?.filter((r: { status: string }) => r.status !== 'published').length || 0
      setResult({
        count: data.count,
        message: `${data.count} dû(s) · ${ok} publié(s) · ${failed} échec(s)`,
      })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur cron')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={publishDue}
        disabled={loading}
        className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium flex items-center gap-1.5 disabled:opacity-40"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Publier les posts dus
      </button>
      {result && <span className="text-xs text-gray-400">{result.message}</span>}
      {error && <span className="text-xs text-red-300">{error}</span>}
    </div>
  )
}
