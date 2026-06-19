'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, CalendarClock, Send, Loader2, AlertCircle, Sparkles, X, Trash2 } from 'lucide-react'
import type { Post, SupervisorReview } from '@/types/post'
import { PublishErrorHint } from '@/components/posts/PublishErrorHint'
import { getMetaCtaLabel } from '@/lib/meta-cta-types'

interface PostActionsProps {
  post: Post
  /** Refresh the parent server component after a mutation. */
  refresh?: boolean
  /** Pre-computed countdown label for scheduled posts, e.g. "Dans 2h" or "En retard de 3h". */
  scheduleLabel?: string
}

export function PostActions({ post, refresh = true, scheduleLabel }: PostActionsProps) {
  const router = useRouter()
  const [status, setStatus] = useState(post.status)
  const [scheduledAt, setScheduledAt] = useState<string>(
    post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : ''
  )
  const [busy, setBusy] = useState<'schedule' | 'publish' | 'unschedule' | 'reset' | null>(null)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

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
      setConfirmOpen(false)
    }
  }

  async function resetToDraft() {
    setBusy('reset')
    setError('')
    try {
      const res = await fetch(`/api/posts/${post.id}/reset`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur reset')
      setStatus(data.post.status)
      if (refresh) router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur reset')
    } finally {
      setBusy(null)
    }
  }

  const isPublished = status === 'published'
  const isScheduled = status === 'scheduled'
  const isFailed = status === 'failed'

  return (
    <div className="space-y-3">
      {isFailed && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-950/20 border border-red-700/30">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          <span className="text-xs text-red-300 flex-1">Publication échouée</span>
          <button
            onClick={resetToDraft}
            disabled={!!busy}
            title="Remettre ce post en brouillon pour le corriger et réessayer"
            className="text-[11px] px-2.5 py-1 rounded border border-amber-700/50 text-amber-300 hover:bg-amber-900/30 transition-colors disabled:opacity-40"
          >
            {busy === 'reset' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Remettre en brouillon'}
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={!!busy}
            title="Réessayer la publication immédiatement sans correction"
            className="text-[11px] px-2.5 py-1 rounded border border-red-700/50 text-red-300 hover:bg-red-900/30 transition-colors disabled:opacity-40"
          >
            {busy === 'publish' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Réessayer'}
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-end gap-2">
        {/* Date picker */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1.5 font-medium">
            Planification
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
            disabled={isPublished}
            title="Choisir la date et l'heure auxquelles ce post doit être publié automatiquement"
            className="w-full px-3 py-2 rounded-lg bg-gray-950/60 border border-gray-800 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
          />
          {!isPublished && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {quickScheduleOptions().map(opt => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setScheduledAt(opt.value)}
                  title={`Planifier ${opt.label}`}
                  className="text-[10px] px-2 py-0.5 rounded border border-gray-700 text-gray-500 hover:border-blue-700 hover:text-blue-300 transition-colors"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Schedule button */}
        <button
          onClick={schedule}
          disabled={!scheduledAt || !!busy || isPublished}
          title={isScheduled ? 'Modifier la date de publication programmée' : 'Planifier ce post pour une publication automatique'}
          className="px-3 py-2 rounded-lg border border-blue-700/50 text-blue-300 hover:bg-blue-900/30 hover:border-blue-600/60 text-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.98]"
        >
          {busy === 'schedule' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CalendarClock className="w-3.5 h-3.5" />}
          {isScheduled ? 'Reporter' : 'Planifier'}
        </button>

        {/* Unschedule button */}
        {isScheduled && (
          <button
            onClick={unschedule}
            disabled={!!busy}
            title="Retirer ce post du calendrier sans le supprimer"
            className="px-3 py-2 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 hover:border-gray-600 hover:text-gray-300 text-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.98]"
          >
            {busy === 'unschedule' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Annuler'}
          </button>
        )}

        {/* Publish now — primary action */}
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={!!busy || isPublished}
          title="Publier immédiatement ce post sur les plateformes connectées du client"
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:opacity-90 active:scale-[0.98] text-white text-sm font-medium flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-md shadow-emerald-900/30"
        >
          {busy === 'publish' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Publier maintenant
        </button>
      </div>

      {scheduleLabel && isScheduled && (
        <p className={`text-xs ${scheduleLabel.startsWith('En retard') ? 'text-red-400' : 'text-blue-400'}`}>
          {scheduleLabel.startsWith('En retard') ? '⏰' : '📅'} {scheduleLabel}
        </p>
      )}

      {/* Error feedback */}
      {error && (
        <div className="text-xs text-red-300 bg-red-950/30 border border-red-700/30 rounded-lg p-3 flex gap-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      <PublishErrorHint error={error} clientId={post.clientId} />

      {/* Warning feedback */}
      {warning && (
        <div className="text-xs text-amber-300 bg-amber-950/30 border border-amber-700/30 rounded-lg p-3 flex gap-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{warning}</span>
        </div>
      )}

      {/* Confirmation modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-700 bg-gray-950 shadow-2xl shadow-black/60">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-white">Confirmer la publication</h3>
                <p className="text-xs text-gray-500 mt-0.5">Vérifie le récapitulatif avant l&apos;envoi Meta.</p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={busy === 'publish'}
                className="rounded-lg border border-gray-800 p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white hover:border-gray-700 disabled:opacity-40 transition-all duration-150"
                title="Fermer la confirmation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal body */}
            <div className="space-y-2 px-5 py-4 text-sm">
              <ConfirmRow label="Plateformes" value={post.platforms.map(p => p.toUpperCase()).join(' + ')} />
              <ConfirmRow label="Visuel" value={post.imageUrl ? (post.contentType === 'reel' ? 'Vidéo attachée' : 'Image attachée') : 'Aucun visuel'} />
              <ConfirmRow label="CTA" value={post.ctaType ? `${getMetaCtaLabel(post.ctaType)}${post.ctaUrl ? ` · ${post.ctaUrl}` : ''}` : (post.cta || 'Aucun CTA Meta')} />
              <ConfirmRow
                label="Supervisor"
                value={post.supervisorReview
                  ? `${post.supervisorReview.verdict} · ${post.supervisorReview.score}/100`
                  : 'Pas encore supervisé'}
              />
              {post.supervisorReview?.summary && (
                <div className="rounded-xl border border-purple-700/30 bg-purple-950/20 p-3 text-xs text-purple-100 leading-relaxed">
                  {post.supervisorReview.summary}
                </div>
              )}
              {post.supervisorReview?.verdict === 'blocked' && (
                <div className="rounded-xl border border-red-700/40 bg-red-950/30 p-3 text-xs text-red-100 font-medium">
                  Verdict bloquant : corrige le post avant publication.
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-2 border-t border-gray-800 px-5 py-4">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={busy === 'publish'}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:border-gray-600 hover:text-white disabled:opacity-40 transition-all duration-150 active:scale-[0.98]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={publishNow}
                disabled={busy === 'publish' || post.supervisorReview?.verdict === 'blocked'}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:opacity-90 active:scale-[0.98] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 transition-all duration-150 shadow-md shadow-emerald-900/30"
              >
                {busy === 'publish' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Confirmer et publier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-gray-800 bg-gray-900/50 px-3 py-2.5">
      <span className="text-xs uppercase tracking-wider text-gray-500 font-medium flex-shrink-0">{label}</span>
      <span className="max-w-[70%] text-right text-sm text-gray-200 break-words">{value}</span>
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
    review?.verdict === 'ready'   ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40' :
    review?.verdict === 'blocked' ? 'bg-red-900/40 text-red-300 border-red-700/40' :
    review?.verdict === 'revise'  ? 'bg-amber-900/40 text-amber-300 border-amber-700/40' :
    'bg-gray-800 text-gray-400 border-gray-700'

  return (
    <div className="bg-gray-950/40 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-white">Claude Supervisor</span>
          {review && (
            <>
              <span className={`text-[11px] border rounded-full px-2 py-0.5 font-medium ${verdictColor}`}>{review.verdict}</span>
              <span className="text-xs text-gray-500 font-mono">{review.score}/100</span>
            </>
          )}
        </div>
        <button
          onClick={supervise}
          disabled={loading}
          title="Demander à l'agent superviseur de relire le post, détecter les risques et donner un score qualité"
          className="group px-3 py-1.5 rounded-lg border border-purple-700/40 text-purple-300 hover:bg-purple-900/30 hover:border-purple-600/60 text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.98]"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-150" />}
          {review ? 'Re-superviser' : 'Demander supervision'}
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-300 bg-red-950/30 border border-red-700/30 rounded-lg p-2.5">{error}</div>
      )}

      {review && (
        <div className="space-y-3 text-sm text-gray-300">
          <p className="italic text-gray-300 leading-relaxed">{review.summary}</p>
          {review.risks.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-red-400 mb-1.5 font-medium">Risques</div>
              <ul className="space-y-1">
                {review.risks.map(r => (
                  <li key={r} className="text-xs text-red-300/90 bg-red-950/20 border border-red-700/20 rounded-lg px-3 py-1.5 leading-snug">{r}</li>
                ))}
              </ul>
            </div>
          )}
          {review.improvements.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-purple-400 mb-1.5 font-medium">Améliorations suggérées</div>
              <ul className="space-y-1">
                {review.improvements.map(r => (
                  <li key={r} className="text-xs text-purple-300/90 bg-purple-950/20 border border-purple-700/20 rounded-lg px-3 py-1.5 leading-snug">{r}</li>
                ))}
              </ul>
            </div>
          )}
          {review.nextAction && (
            <div className="bg-purple-950/30 border border-purple-700/30 rounded-lg p-3 text-xs text-purple-200 leading-relaxed">
              <span className="font-semibold text-purple-100">Prochaine action :</span> {review.nextAction}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function PostDeleteButton({ post, redirectTo }: { post: Post; redirectTo?: string }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function doDelete() {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
    const d = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError((d as { error?: string }).error ?? 'Erreur suppression')
      setLoading(false)
      return
    }
    if (redirectTo) {
      router.push(redirectTo)
    } else {
      router.refresh()
    }
  }

  if (post.status === 'published') return null

  if (confirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-300">Supprimer définitivement ?</span>
        <button
          type="button"
          onClick={doDelete}
          disabled={loading}
          className="px-2.5 py-1 rounded-lg bg-red-700 hover:bg-red-600 text-white text-xs font-medium disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : 'Oui, supprimer'}
        </button>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          className="px-2.5 py-1 rounded-lg border border-gray-700 text-gray-400 text-xs"
        >
          Annuler
        </button>
        {error && <span className="text-xs text-red-300">{error}</span>}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirm(true)}
      title="Supprimer ce post définitivement"
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-700 text-gray-500 hover:text-red-400 hover:border-red-700/40 text-xs transition-colors"
    >
      <Trash2 className="w-3.5 h-3.5" />
      Supprimer
    </button>
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
        title="Lancer manuellement le cron de publication pour tester les posts dont la date est dépassée"
        className="group px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 active:scale-[0.98] text-white text-sm font-medium flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-md shadow-blue-900/30"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-150" />}
        Publier les posts dus
      </button>
      {result && <span className="text-xs text-gray-400 font-mono">{result.message}</span>}
      {error && <span className="text-xs text-red-300">{error}</span>}
    </div>
  )
}

function quickScheduleOptions(): { label: string; value: string }[] {
  const pad = (n: number) => String(n).padStart(2, '0')
  function fmt(d: Date, h: number) {
    const c = new Date(d)
    c.setHours(h, 0, 0, 0)
    return `${c.getFullYear()}-${pad(c.getMonth() + 1)}-${pad(c.getDate())}T${pad(h)}:00`
  }
  const now = new Date()
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1)
  const in2days = new Date(now); in2days.setDate(now.getDate() + 2)
  const in7days = new Date(now); in7days.setDate(now.getDate() + 7)
  return [
    { label: 'Demain 10h', value: fmt(tomorrow, 10) },
    { label: 'Demain 19h', value: fmt(tomorrow, 19) },
    { label: '+2j 10h',    value: fmt(in2days, 10) },
    { label: '+7j 10h',    value: fmt(in7days, 10) },
  ]
}
