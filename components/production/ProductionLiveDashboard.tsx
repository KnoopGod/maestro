'use client'

import Link from 'next/link'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, Bot, Clock, DollarSign, RefreshCw, Send, Sparkles } from 'lucide-react'
import type { AgentEvent, AgentJob, AgentProductionStats } from '@/lib/db/queries/agent-jobs'
import type { ProductionPostStats } from '@/lib/db/queries/production'

type JobWithEvents = AgentJob & { events: AgentEvent[] }

interface ProductionStatus {
  generatedAt: number
  posts: ProductionPostStats
  agents: AgentProductionStats
  jobs: JobWithEvents[]
}

const EVENT_LABELS: Record<string, string> = {
  pending: 'En attente',
  running: 'En cours',
  completed: 'Terminé',
  failed: 'Erreur',
  skipped: 'Ignoré',
}

function formatDuration(ms: number) {
  if (!ms) return '0s'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${Math.round(ms / 1000)}s`
  return `${Math.floor(ms / 60000)}min ${Math.round((ms % 60000) / 1000)}s`
}

function currentEvent(job: JobWithEvents) {
  return job.events.find(event => event.status === 'running')
    ?? job.events.find(event => event.status === 'pending')
    ?? job.events[job.events.length - 1]
}

function jobProgress(job: JobWithEvents) {
  if (job.status === 'completed') return 100
  if (job.status === 'failed') return 100
  if (!job.events.length) return job.status === 'running' ? 8 : 0
  const completed = job.events.filter(event => event.status === 'completed' || event.status === 'skipped').length
  return Math.min(95, Math.max(8, Math.round((completed / Math.max(job.events.length, 5)) * 100)))
}

export function ProductionLiveDashboard({ initial }: { initial: ProductionStatus }) {
  const [data, setData] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/production/status?limit=16', { cache: 'no-store' })
      const next = await res.json()
      if (!res.ok) throw new Error(next.error || 'Erreur monitoring')
      setData(next)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur monitoring')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const interval = window.setInterval(refresh, 2500)
    return () => window.clearInterval(interval)
  }, [refresh])

  const activeJobs = useMemo(() => data.jobs.filter(job => job.status === 'running'), [data.jobs])
  const attentionJobs = useMemo(() => data.jobs.filter(job => job.status === 'failed' || job.status === 'awaiting_validation'), [data.jobs])
  const activePostCount = data.posts.draft + data.posts.ready + data.posts.scheduled

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Activity className="w-7 h-7 text-emerald-400" />
            Production temps réel
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Supervision des posts, agents IA, coûts et files de traitement.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs text-gray-300 hover:bg-gray-800 disabled:opacity-50"
          title="Actualiser immédiatement le dashboard de production"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-800/40 bg-red-950/30 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon={Sparkles} label="Posts en cours" value={activePostCount} sub={`${data.posts.published} publiés`} color="text-purple-300" />
        <MetricCard icon={Bot} label="Agents actifs" value={data.agents.events.running} sub={`${data.agents.events.pending} en attente`} color="text-emerald-300" />
        <MetricCard icon={Clock} label="Temps moyen" value={formatDuration(data.agents.performance.avgDurationMs)} sub="par génération" color="text-blue-300" />
        <MetricCard icon={DollarSign} label="Coût moyen" value={`$${data.posts.avgCost.toFixed(4)}`} sub={`${data.posts.avgTokens} tokens moy.`} color="text-amber-300" />
      </div>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Pipeline des traitements</h2>
            <span className="text-[10px] text-gray-600 font-mono">
              {data.generatedAt ? `MAJ ${new Date(data.generatedAt).toLocaleTimeString('fr-FR')}` : 'Initialisation'}
            </span>
          </div>

          {data.jobs.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">Aucun job agent enregistré.</p>
          ) : (
            <div className="space-y-3">
              {data.jobs.map(job => {
                const event = currentEvent(job)
                const progress = jobProgress(job)
                return (
                  <Link
                    key={job.id}
                    href={`/agents/jobs/${job.id}`}
                    className="block rounded-xl border border-gray-800 bg-gray-950/40 p-4 hover:border-purple-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${job.status === 'running' ? 'bg-purple-400 animate-pulse' : job.status === 'failed' ? 'bg-red-400' : 'bg-emerald-400'}`} />
                          <span className="text-sm font-medium text-white truncate">{job.clientName ?? job.clientId}</span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500 truncate">{job.briefSummary ?? 'Job agent'}</p>
                        {event && (
                          <p className="mt-2 text-xs text-gray-300">
                            <span className="text-purple-300">{event.agent}</span> · {EVENT_LABELS[event.status]} · {event.taskLabel}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-[10px] text-gray-500 flex-shrink-0">
                        <div>{progress}%</div>
                        <div>{job.completedAt ? formatDuration(job.completedAt - job.startedAt) : formatDuration(Math.max(0, data.generatedAt - job.startedAt))}</div>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                      <div className={`h-full ${job.status === 'failed' ? 'bg-red-400' : job.status === 'completed' ? 'bg-emerald-400' : 'bg-purple-400'}`} style={{ width: `${progress}%` }} />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <StatusPanel title="Production" rows={[
            ['Brouillons', data.posts.draft],
            ['Validation interne', data.posts.ready],
            ['Programmés', data.posts.scheduled],
            ['Publiés', data.posts.published],
            ['Erreurs', data.posts.failed],
          ]} />
          <StatusPanel title="Files agents" rows={[
            ['Jobs actifs', data.agents.jobs.running],
            ['À valider', data.agents.jobs.awaitingValidation],
            ['Jobs terminés', data.agents.jobs.completed],
            ['Jobs en erreur', data.agents.jobs.failed],
          ]} />
          {attentionJobs.length > 0 && (
            <div className="rounded-2xl border border-amber-800/40 bg-amber-950/20 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-200 mb-2">
                <AlertTriangle className="w-4 h-4" />
                Attention requise
              </div>
              <div className="space-y-2">
                {attentionJobs.slice(0, 4).map(job => (
                  <Link key={job.id} href={`/agents/jobs/${job.id}`} className="block text-xs text-amber-100/80 hover:underline">
                    {job.clientName ?? job.clientId} · {job.briefSummary ?? job.status}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {activeJobs.length > 0 && (
            <div className="rounded-2xl border border-purple-800/40 bg-purple-950/20 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-purple-200 mb-2">
                <Send className="w-4 h-4" />
                Agents en direct
              </div>
              <div className="space-y-2">
                {activeJobs.slice(0, 4).map(job => {
                  const event = currentEvent(job)
                  return (
                    <div key={job.id} className="text-xs text-gray-300">
                      <span className="text-purple-300">{event?.agent ?? 'agent'}</span> · {event?.taskLabel ?? job.briefSummary}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType
  label: string
  value: string | number
  sub: string
  color: string
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-[11px] text-gray-600 mt-1">{sub}</div>
    </div>
  )
}

function StatusPanel({ title, rows }: { title: string; rows: Array<[string, number]> }) {
  const max = Math.max(...rows.map(([, value]) => value), 1)
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
      <h2 className="text-sm font-semibold text-white mb-3">{title}</h2>
      <div className="space-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-400">{label}</span>
              <span className="text-white">{value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
              <div className="h-full bg-indigo-400" style={{ width: `${(value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
