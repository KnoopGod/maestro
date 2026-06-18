'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, ExternalLink } from 'lucide-react'
import { AGENTS } from '@/lib/agent-registry'
import type { AgentJob, AgentEvent } from '@/lib/db/queries/agent-jobs'

type JobWithEvents = AgentJob & { events: AgentEvent[] }

const STATUS_CFG = {
  pending:   { label: 'En attente', color: 'text-gray-400',   bg: 'bg-gray-800',          dot: 'bg-gray-600' },
  running:   { label: 'En cours',   color: 'text-purple-300', bg: 'bg-purple-950/40',     dot: 'bg-purple-400 animate-pulse' },
  completed: { label: 'Terminé',    color: 'text-emerald-300',bg: 'bg-emerald-950/30',    dot: 'bg-emerald-400' },
  failed:    { label: 'Erreur',     color: 'text-red-300',    bg: 'bg-red-950/30',        dot: 'bg-red-400' },
  skipped:   { label: 'Ignoré',     color: 'text-gray-500',   bg: 'bg-gray-900/20',       dot: 'bg-gray-700' },
}

const JOB_STATUS_CFG = {
  running:             { label: 'En cours',          color: 'text-purple-300 border-purple-700/40 bg-purple-950/30' },
  completed:           { label: 'Terminé',            color: 'text-emerald-300 border-emerald-700/40 bg-emerald-950/30' },
  failed:              { label: 'Erreur',             color: 'text-red-300 border-red-700/40 bg-red-950/30' },
  awaiting_validation: { label: 'Validation requise', color: 'text-amber-300 border-amber-700/40 bg-amber-950/30' },
}

function elapsed(ms?: number) {
  if (!ms) return ''
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function since(ts: number, now: number) {
  const s = Math.floor((now - ts) / 1000)
  if (s < 60) return `il y a ${s}s`
  if (s < 3600) return `il y a ${Math.floor(s / 60)}min`
  return `il y a ${Math.floor(s / 3600)}h`
}

function agentMeta(id: string) {
  return AGENTS.find(a => a.id === id) ?? { emoji: '🤖', name: id, color: 'from-gray-600 to-gray-800' }
}

function EventRow({ event, isLast }: { event: AgentEvent; isLast: boolean }) {
  const [open, setOpen] = useState(false)
  const cfg = STATUS_CFG[event.status]
  const agent = agentMeta(event.agent)

  return (
    <div className="relative">
      {/* Connecting line */}
      {!isLast && (
        <div className="absolute left-6 top-14 bottom-0 w-px bg-gray-800" />
      )}

      <div className={`relative rounded-xl border transition-all ${cfg.bg} ${
        event.status === 'running' ? 'border-purple-700/50 shadow-sm shadow-purple-900/20' : 'border-gray-800'
      }`}>
        <button
          onClick={() => event.outputSummary || event.errorMessage ? setOpen(o => !o) : undefined}
          className="w-full flex items-start gap-4 p-4 text-left"
        >
          {/* Agent avatar */}
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-lg flex-shrink-0 shadow-md`}>
            {agent.emoji}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-sm font-medium text-white">{(agent as typeof agent & {name: string}).name.split(' · ')[0]}</span>
              <span className={`text-[10px] border rounded-full px-2 py-0.5 ${cfg.color} border-current/30`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${cfg.dot} mr-1`} />
                {cfg.label}
              </span>
              {event.durationMs && (
                <span className="text-[10px] text-gray-600">{elapsed(event.durationMs)}</span>
              )}
            </div>
            <div className="text-xs text-gray-400">{event.taskLabel}</div>
            {event.outputSummary && (
              <div className="text-xs text-gray-300 mt-1.5 leading-relaxed">{event.outputSummary}</div>
            )}
          </div>

          {/* Status icon */}
          <div className="flex-shrink-0 mt-1">
            {event.status === 'completed' && <span className="text-emerald-400">✓</span>}
            {event.status === 'failed'    && <span className="text-red-400">✗</span>}
            {event.status === 'skipped'   && <span className="text-gray-600">–</span>}
            {event.status === 'running'   && <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse inline-block" />}
            {event.status === 'pending'   && <span className="text-gray-700">⏳</span>}
          </div>
        </button>

        {/* Error detail */}
        {event.status === 'failed' && event.errorMessage && (
          <div className="mx-4 mb-4 p-3 rounded-lg bg-red-950/40 border border-red-800/40">
            <p className="text-xs text-red-300">{event.errorMessage}</p>
            {event.errorAction === 'retry' && (
              <p className="text-[10px] text-gray-500 mt-1">→ Réessaie la génération depuis le Studio</p>
            )}
            {event.errorAction === 'fix_config' && (
              <p className="text-[10px] text-gray-500 mt-1">→ Vérifie la configuration dans Connexions</p>
            )}
          </div>
        )}

        {/* Output data (expandable) */}
        {open && event.outputData && (
          <div className="mx-4 mb-4 p-3 rounded-lg bg-gray-950/60 border border-gray-800">
            <pre className="text-[10px] text-gray-400 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(event.outputData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const clientFilter = searchParams.get('client')
  const agentsHref = clientFilter ? `/agents?client=${clientFilter}` : '/agents'
  const [job, setJob] = useState<JobWithEvents | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(0)
  const [now, setNow] = useState(0)

  const fetchJob = useCallback(async () => {
    try {
      const fetchedAt = new Date().getTime()
      const res = await fetch(`/api/agents/jobs/${id}`)
      if (!res.ok) return
      const data = await res.json()
      setJob(data.job)
      setLastUpdated(fetchedAt)
      setNow(fetchedAt)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [id])

  useEffect(() => {
    const timer = window.setTimeout(fetchJob, 0)
    return () => window.clearTimeout(timer)
  }, [fetchJob])

  // Polling toutes les 2s si le job est en cours
  useEffect(() => {
    if (!job || job.status !== 'running') return
    const interval = setInterval(fetchJob, 2000)
    return () => clearInterval(interval)
  }, [job, fetchJob])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Chargement...
      </div>
    )
  }

  if (!job) {
    return (
      <div className="text-center py-24 text-gray-500">
        Job introuvable.
        <div className="mt-2"><Link href={agentsHref} className="text-purple-400 hover:underline">← Retour aux agents</Link></div>
      </div>
    )
  }

  const jobCfg = JOB_STATUS_CFG[job.status]
  const totalDuration = job.completedAt ? job.completedAt - job.startedAt : now - job.startedAt
  const runningEvent = job.events?.find(e => e.status === 'running')

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Breadcrumb */}
      <Link href={agentsHref} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Activité agents
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="text-4xl">{job.clientEmoji ?? '🤖'}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-xl font-bold text-white">{job.clientName ?? job.clientId}</h1>
            <span className={`text-xs border rounded-full px-2.5 py-0.5 ${jobCfg.color}`}>
              {jobCfg.label}
            </span>
          </div>
          <p className="text-sm text-gray-400">{job.briefSummary}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
            <span>{since(job.startedAt, now)}</span>
            <span>·</span>
            <span>{elapsed(totalDuration)} total</span>
            {job.totalCost > 0 && <><span>·</span><span>${job.totalCost.toFixed(4)}</span></>}
          </div>
        </div>
        <button
          onClick={fetchJob}
          className="p-2 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
          title="Actualiser"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Current activity banner (si en cours) */}
      {job.status === 'running' && runningEvent && (
        <div className="bg-purple-950/30 border border-purple-700/40 rounded-xl p-4 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-purple-300">{agentMeta(runningEvent.agent).emoji} {agentMeta(runningEvent.agent).name.split(' · ')[0]}</p>
            <p className="text-xs text-gray-400">{runningEvent.taskLabel}</p>
          </div>
          <span className="ml-auto text-xs text-gray-600 animate-pulse">en cours...</span>
        </div>
      )}

      {/* Post link si terminé */}
      {job.postId && job.status === 'completed' && (
        <Link
          href={`/posts/${job.postId}?from=agents&agentsBack=${encodeURIComponent(clientFilter ? `/agents/jobs/${id}?client=${clientFilter}` : `/agents/jobs/${id}`)}`}
          className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Voir le post généré → #{job.postId.substring(0, 8)}
        </Link>
      )}

      {/* Timeline */}
      {job.events && job.events.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-white mb-3">Timeline</h2>
          {job.events.map((event, idx) => (
            <EventRow key={event.id} event={event} isLast={idx === job.events!.length - 1} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-600 text-sm bg-gray-900/20 border border-dashed border-gray-800 rounded-xl">
          Aucun événement enregistré
        </div>
      )}

      {/* Footer polling indicator */}
      {job.status === 'running' && (
        <p className="text-center text-[10px] text-gray-700">
          Actualisation automatique toutes les 2s · dernière à {new Date(lastUpdated).toLocaleTimeString('fr-FR')}
        </p>
      )}
    </div>
  )
}
