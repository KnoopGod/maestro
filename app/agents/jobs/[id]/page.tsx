'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, ExternalLink, Timer, DollarSign, CheckCircle2, XCircle, Minus, Loader2, Clock } from 'lucide-react'
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
  running:             { label: 'En cours',          color: 'text-indigo-300 border-indigo-700/40 bg-indigo-950/30' },
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
  const hasExpandable = !!(event.outputSummary || event.errorMessage || event.outputData)

  return (
    <div className="relative">
      {/* Connecting line */}
      {!isLast && (
        <div className="absolute left-7 top-[60px] bottom-0 w-px bg-gray-800" />
      )}

      <div className={`relative rounded-xl border transition-all duration-150 ${cfg.bg} ${
        event.status === 'running'
          ? 'border-purple-700/50 shadow-sm shadow-purple-900/20'
          : event.status === 'failed'
          ? 'border-red-800/40'
          : 'border-gray-800'
      }`}>
        <button
          onClick={() => hasExpandable ? setOpen(o => !o) : undefined}
          className={`w-full flex items-start gap-4 p-4 text-left ${hasExpandable ? 'cursor-pointer' : 'cursor-default'}`}
        >
          {/* Agent avatar */}
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-lg flex-shrink-0 shadow-md`}>
            {agent.emoji}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-sm font-medium text-[#E0E3FF]">{(agent as typeof agent & {name: string}).name.split(' · ')[0]}</span>
              <span className={`text-[11px] border rounded-full px-2 py-0.5 ${cfg.color} border-current/30 inline-flex items-center gap-1`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                {cfg.label}
              </span>
              {event.durationMs && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  {elapsed(event.durationMs)}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400">{event.taskLabel}</div>
            {event.outputSummary && !open && (
              <div className="text-xs text-gray-400 mt-1.5 leading-relaxed line-clamp-2">{event.outputSummary}</div>
            )}
          </div>

          {/* Status icon */}
          <div className="flex-shrink-0 mt-0.5">
            {event.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {event.status === 'failed'    && <XCircle className="w-4 h-4 text-red-400" />}
            {event.status === 'skipped'   && <Minus className="w-4 h-4 text-gray-600" />}
            {event.status === 'running'   && <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />}
            {event.status === 'pending'   && <Clock className="w-4 h-4 text-gray-600" />}
          </div>
        </button>

        {/* Error detail */}
        {event.status === 'failed' && event.errorMessage && (
          <div className="mx-4 mb-4 p-3 rounded-lg bg-red-950/40 border border-red-800/40">
            <p className="text-xs text-red-300 font-mono leading-relaxed">{event.errorMessage}</p>
            {event.errorAction === 'retry' && (
              <p className="text-[11px] text-gray-500 mt-1.5">Réessaie la génération depuis le Studio</p>
            )}
            {event.errorAction === 'fix_config' && (
              <p className="text-[11px] text-gray-500 mt-1.5">Vérifie la configuration dans Connexions</p>
            )}
          </div>
        )}

        {/* Output data (expandable) */}
        {open && event.outputData && (
          <div className="mx-4 mb-4 rounded-lg bg-gray-950 border border-gray-800 overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-800 flex items-center justify-between">
              <span className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Output</span>
              {event.outputSummary && (
                <p className="text-xs text-gray-400 max-w-[70%] truncate">{event.outputSummary}</p>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto">
              <pre className="text-xs font-mono text-gray-400 p-3 whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(event.outputData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
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
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-sm text-gray-500">Chargement du job...</p>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <XCircle className="w-10 h-10 text-gray-700" />
        <p className="text-sm font-medium text-gray-400">Job introuvable</p>
        <Link
          href="/agents"
          className="group inline-flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors duration-150"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
          Retour aux agents
        </Link>
      </div>
    )
  }

  const jobCfg = JOB_STATUS_CFG[job.status]
  const totalDuration = job.completedAt ? job.completedAt - job.startedAt : now - job.startedAt
  const runningEvent = job.events?.find(e => e.status === 'running')

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Breadcrumb */}
      <Link
        href="/agents"
        className="group inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors duration-150"
      >
        <ArrowLeft className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
        Activité agents
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="text-4xl leading-none">{job.clientEmoji ?? '🤖'}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <h1 className="text-xl font-bold text-[#E0E3FF]">{job.clientName ?? job.clientId}</h1>
            <span className={`text-[11px] border rounded-full px-2.5 py-0.5 ${jobCfg.color}`}>
              {jobCfg.label}
            </span>
          </div>
          <p className="text-sm text-gray-400">{job.briefSummary}</p>
        </div>
        <button
          onClick={fetchJob}
          className="p-2 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-all duration-150 active:scale-95 flex-shrink-0"
          title="Actualiser"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Métriques proéminentes */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 uppercase tracking-wider mb-1.5">
            <Timer className="w-3 h-3" />
            Durée
          </div>
          <div className="text-xl font-bold text-[#E0E3FF]">{elapsed(totalDuration) || '—'}</div>
          <div className="text-xs text-gray-500 mt-0.5">{since(job.startedAt, now)}</div>
        </div>
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 uppercase tracking-wider mb-1.5">
            <DollarSign className="w-3 h-3" />
            Coût IA
          </div>
          <div className={`text-xl font-bold ${job.totalCost > 0 ? 'text-[#E0E3FF]' : 'text-gray-600'}`}>
            {job.totalCost > 0 ? `$${job.totalCost.toFixed(4)}` : '—'}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">total</div>
        </div>
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 uppercase tracking-wider mb-1.5">
            <Timer className="w-3 h-3" />
            Statut
          </div>
          <div className={`text-xl font-bold ${job.status === 'completed' ? 'text-emerald-400' : job.status === 'failed' ? 'text-red-400' : job.status === 'running' ? 'text-indigo-400' : 'text-amber-400'}`}>
            {job.status === 'completed' ? 'OK' : job.status === 'failed' ? 'KO' : job.status === 'running' ? '...' : 'ATT'}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{job.events?.length ?? 0} étapes</div>
        </div>
      </div>

      {/* Current activity banner (si en cours) */}
      {job.status === 'running' && runningEvent && (
        <div className="bg-purple-950/30 border border-purple-700/40 rounded-xl p-4 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-purple-300">
              {agentMeta(runningEvent.agent).emoji} {agentMeta(runningEvent.agent).name.split(' · ')[0]}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{runningEvent.taskLabel}</p>
          </div>
          <span className="text-xs text-gray-500 animate-pulse flex-shrink-0">en cours...</span>
        </div>
      )}

      {/* Post link si terminé */}
      {job.postId && job.status === 'completed' && (
        <Link
          href="/plan"
          className="group flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors duration-150 bg-indigo-950/20 border border-indigo-800/30 rounded-xl px-4 py-3"
        >
          <ExternalLink className="w-4 h-4 flex-shrink-0 transition-transform duration-150 group-hover:scale-110" />
          <span>Voir le post généré</span>
          <span className="text-xs text-gray-500 ml-1">#{job.postId.substring(0, 8)}</span>
        </Link>
      )}

      {/* Timeline */}
      {job.events && job.events.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-[#E0E3FF] mb-3">Timeline</h2>
          {job.events.map((event, idx) => (
            <EventRow key={event.id} event={event} isLast={idx === job.events!.length - 1} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-10 text-center bg-gray-900/20 border border-dashed border-gray-800 rounded-xl">
          <Clock className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-400">Aucun événement enregistré</p>
          <p className="text-xs text-gray-600 mt-1">Les étapes du pipeline apparaîtront ici</p>
        </div>
      )}

      {/* Footer polling indicator */}
      {job.status === 'running' && (
        <p className="text-center text-[11px] text-gray-600">
          Actualisation automatique toutes les 2s · dernière à {new Date(lastUpdated).toLocaleTimeString('fr-FR')}
        </p>
      )}
    </div>
  )
}
