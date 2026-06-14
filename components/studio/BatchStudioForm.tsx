'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Sparkles, Loader2, CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react'
import type { Client } from '@/types/client'
import type { Platform, ContentType, JobProgress, JobProgressEvent } from '@/lib/studio/types'
import { PLATFORM_INFO, CONTENT_TYPE_INFO } from '@/lib/studio/types'
import { pollJob } from '@/lib/studio/poll-job'

interface PostIdea {
  title: string
  pillar: string
  objective: string
  brief: string
  platforms: string[]
}

interface BatchSlot {
  jobId: string
  idea: PostIdea
  progress: JobProgress | null
  error: string | null
  done: boolean
}

const COUNT_OPTIONS = [3, 5, 7] as const

export function BatchStudioForm({ clients }: { clients: Client[] }) {
  const [clientId, setClientId] = useState(clients[0]?.id || '')
  const [count, setCount] = useState<3 | 5 | 7>(5)
  const [platforms, setPlatforms] = useState<Platform[]>(['instagram'])
  const [contentType, setContentType] = useState<ContentType>('photo')
  const [skipImage, setSkipImage] = useState(false)

  const [slots, setSlots] = useState<BatchSlot[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [allDone, setAllDone] = useState(false)

  const abortRefs = useRef<AbortController[]>([])

  useEffect(() => {
    return () => { abortRefs.current.forEach(c => c.abort()) }
  }, [])

  function togglePlatform(p: Platform) {
    setPlatforms(prev =>
      prev.includes(p) ? (prev.length > 1 ? prev.filter(x => x !== p) : prev) : [...prev, p]
    )
  }

  function updateSlot(index: number, patch: Partial<BatchSlot>) {
    setSlots(prev => {
      const next = [...prev]
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  async function handleSubmit() {
    if (!clientId || platforms.length === 0 || isSubmitting) return
    abortRefs.current.forEach(c => c.abort())
    abortRefs.current = []
    setSlots([])
    setAllDone(false)
    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/studio/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, count, platforms, contentType, skipImage }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur génération en lot')

      const { jobIds, ideas } = data as { jobIds: string[]; ideas: PostIdea[] }
      const initialSlots: BatchSlot[] = jobIds.map((jobId, i) => ({
        jobId,
        idea: ideas[i] ?? { title: `Post ${i + 1}`, pillar: '', objective: '', brief: '', platforms: [] },
        progress: null,
        error: null,
        done: false,
      }))
      setSlots(initialSlots)
      setIsSubmitting(false)

      // Poll each job independently
      let completedCount = 0
      jobIds.forEach((jobId, index) => {
        const abort = new AbortController()
        abortRefs.current.push(abort)
        pollJob(jobId, { signal: abort.signal, intervalMs: 2000 })
          .then(finalProgress => {
            updateSlot(index, { progress: finalProgress, done: true, error: null })
            completedCount++
            if (completedCount === jobIds.length) setAllDone(true)
          })
          .catch(err => {
            if (err?.name === 'AbortError') return
            updateSlot(index, { error: err.message || 'Erreur inconnue', done: true })
            completedCount++
            if (completedCount === jobIds.length) setAllDone(true)
          })
        // Stream progress updates
        const streamProgress = async () => {
          const abort2 = new AbortController()
          try {
            while (true) {
              const r = await fetch(`/api/agents/jobs/${jobId}`, { signal: abort2.signal })
              if (!r.ok) break
              const { job } = await r.json()
              const p: JobProgress = {
                status: job.status,
                postId: job.postId ?? null,
                events: (job.events ?? []).map((e: Record<string, unknown>): JobProgressEvent => ({
                  agent: e.agent as string,
                  sequence: e.sequence as number,
                  status: e.status as JobProgressEvent['status'],
                  taskLabel: e.taskLabel as string,
                  outputSummary: (e.outputSummary as string | null) ?? null,
                  errorMessage: (e.errorMessage as string | null) ?? null,
                })),
              }
              updateSlot(index, { progress: p })
              if (['completed', 'failed', 'awaiting_validation'].includes(job.status)) break
              await new Promise(r => setTimeout(r, 2000))
            }
          } catch { /* abort or network */ }
        }
        streamProgress()
      })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erreur')
      setIsSubmitting(false)
    }
  }

  const selectedClient = clients.find(c => c.id === clientId)
  const hasSlots = slots.length > 0
  const successCount = slots.filter(s => s.progress?.status === 'completed' || s.progress?.status === 'awaiting_validation').length
  const failedCount = slots.filter(s => s.error || s.progress?.status === 'failed').length

  return (
    <div className="space-y-6">
      {/* Config */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 space-y-5">
        {/* Client */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Client</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {clients.map(c => (
              <button
                key={c.id}
                onClick={() => setClientId(c.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  clientId === c.id
                    ? 'border-purple-500 bg-purple-900/30 text-white'
                    : 'border-gray-700 bg-gray-900/40 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className={`w-7 h-7 rounded-md bg-gradient-to-br ${c.color} flex items-center justify-center text-sm flex-shrink-0`}>
                  {c.emoji}
                </div>
                <span className="truncate">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Nombre de posts</label>
          <div className="flex gap-2">
            {COUNT_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  count === n
                    ? 'border-purple-500 bg-purple-900/30 text-white'
                    : 'border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
              >
                {n} posts
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-600 mt-1.5">
            L&apos;IA génère {count} idées sur des piliers variés, puis crée chaque post indépendamment.
          </p>
        </div>

        {/* Platforms */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Plateformes</label>
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(PLATFORM_INFO) as [Platform, typeof PLATFORM_INFO[Platform]][]).map(([p, info]) => (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  platforms.includes(p)
                    ? info.color
                    : 'border-gray-700 text-gray-500 hover:border-gray-600'
                }`}
              >
                {info.emoji} {info.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content type */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">Type de contenu</label>
          <div className="flex gap-2 flex-wrap">
            {(Object.entries(CONTENT_TYPE_INFO) as [ContentType, typeof CONTENT_TYPE_INFO[ContentType]][]).map(([ct, info]) => (
              <button
                key={ct}
                onClick={() => setContentType(ct)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  contentType === ct
                    ? 'border-purple-500 bg-purple-900/30 text-white'
                    : 'border-gray-700 text-gray-500 hover:border-gray-600'
                }`}
              >
                {info.label}
              </button>
            ))}
          </div>
        </div>

        {/* Skip image */}
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <div
            onClick={() => setSkipImage(v => !v)}
            className={`relative w-9 h-5 rounded-full transition-colors ${skipImage ? 'bg-purple-600' : 'bg-gray-700'}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${skipImage ? 'translate-x-4' : ''}`} />
          </div>
          <span className="text-sm text-gray-300">Mode texte seul <span className="text-gray-500">(sans génération d&apos;image — plus rapide)</span></span>
        </label>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !clientId || platforms.length === 0}
          className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Préparation du plan…</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Générer {count} posts pour {selectedClient?.name ?? '…'}</>
          )}
        </button>

        {submitError && (
          <p className="text-sm text-red-400 bg-red-950/30 border border-red-700/30 rounded-lg px-3 py-2">{submitError}</p>
        )}
      </div>

      {/* Progress slots */}
      {hasSlots && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Génération en cours</h2>
            {allDone && (
              <span className="text-xs text-emerald-400">
                {successCount}/{slots.length} réussis{failedCount > 0 ? ` · ${failedCount} échoués` : ''}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {slots.map((slot, i) => (
              <BatchSlotCard key={slot.jobId} slot={slot} index={i} />
            ))}
          </div>

          {allDone && (
            <div className="bg-emerald-950/20 border border-emerald-700/30 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-white font-semibold">Plan généré !</p>
                <p className="text-sm text-gray-400 mt-0.5">
                  {successCount} post{successCount > 1 ? 's' : ''} en attente de validation.
                </p>
              </div>
              <Link
                href="/validation"
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium flex items-center gap-2 flex-shrink-0 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Voir en Validation
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function BatchSlotCard({ slot, index }: { slot: BatchSlot; index: number }) {
  const { idea, progress, error, done } = slot
  const status = progress?.status ?? 'running'
  const isRunning = !done
  const isSuccess = done && !error && (status === 'completed' || status === 'awaiting_validation')
  const isFailed = done && (!!error || status === 'failed')

  return (
    <div className={`bg-gray-900/40 border rounded-2xl p-4 space-y-3 transition-colors ${
      isSuccess ? 'border-emerald-700/40' : isFailed ? 'border-red-700/40' : 'border-gray-800'
    }`}>
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0 mt-0.5">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {isRunning && <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin flex-shrink-0" />}
            {isSuccess && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
            {isFailed && <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
            {idea.pillar && (
              <span className="text-[10px] text-indigo-300 bg-indigo-950/40 border border-indigo-800/40 rounded-full px-2 py-0.5">
                {idea.pillar}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-white line-clamp-1">{idea.title || idea.brief.substring(0, 60)}</p>
          <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{idea.brief}</p>
        </div>
      </div>

      {/* Agent progress */}
      {progress && (
        <div className="space-y-1">
          {[
            { seq: 1, label: 'Account Director' },
            { seq: 2, label: 'Social Expert' },
            { seq: 3, label: 'Visual Director' },
            { seq: 4, label: 'Supervisor' },
          ].map(({ seq, label }) => {
            const event = progress.events.find(e => e.sequence === seq)
            const evStatus = event?.status ?? 'pending'
            return (
              <div key={seq} className="flex items-center gap-2 text-xs">
                <EventDot status={evStatus} />
                <span className={evStatus === 'running' ? 'text-purple-300' : evStatus === 'completed' || evStatus === 'skipped' ? 'text-gray-400' : 'text-gray-600'}>
                  {event?.taskLabel ?? label}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {!progress && !error && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          En attente de démarrage…
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 bg-red-950/20 border border-red-700/20 rounded-lg px-2.5 py-1.5">{error}</p>
      )}

      {isSuccess && progress?.postId && (
        <Link
          href={`/validation`}
          className="text-xs text-emerald-400 hover:underline"
        >
          Voir dans Validation →
        </Link>
      )}
    </div>
  )
}

function EventDot({ status }: { status: string }) {
  if (status === 'completed') return <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
  if (status === 'running') return <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse flex-shrink-0" />
  if (status === 'failed') return <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
  if (status === 'skipped') return <span className="w-2 h-2 rounded-full bg-gray-600 flex-shrink-0" />
  return <span className="w-2 h-2 rounded-full bg-gray-700 flex-shrink-0" />
}
