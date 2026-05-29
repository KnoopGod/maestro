import Link from 'next/link'
import { Bot, CheckCircle2, Clock, Sparkles, Activity, AlertTriangle, ArrowRight } from 'lucide-react'
import { AGENTS, type AgentStatus, type MaestroAgent } from '@/lib/agent-registry'
import { listRecentJobs } from '@/lib/db/queries/agent-jobs'
import { EmptyState } from '@/components/ui/EmptyState'
import type { AgentJob } from '@/lib/db/queries/agent-jobs'

export const dynamic = 'force-dynamic'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function elapsed(ms?: number) {
  if (!ms) return ''
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(0)}s`
  return `${Math.floor(ms / 60000)}min ${Math.floor((ms % 60000) / 1000)}s`
}

function since(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `il y a ${s}s`
  if (s < 3600) return `il y a ${Math.floor(s / 60)}min`
  if (s < 86400) return `il y a ${Math.floor(s / 3600)}h`
  return `il y a ${Math.floor(s / 86400)}j`
}

const PIPELINE_AGENTS = [
  { id: 'account-director',   seq: 1 },
  { id: 'social-expert',      seq: 2 },
  { id: 'visual-director',    seq: 3 },
  { id: 'supervisor',         seq: 4 },
  { id: 'publisher',          seq: 5 },
]

const JOB_STATUS_CFG = {
  running:             { label: 'En cours',          dot: 'bg-purple-400 animate-pulse', badge: 'bg-purple-950/40 text-purple-300 border-purple-700/40' },
  completed:           { label: 'Terminé',            dot: 'bg-emerald-400',              badge: 'bg-emerald-950/30 text-emerald-300 border-emerald-700/40' },
  failed:              { label: 'Erreur',             dot: 'bg-red-400',                  badge: 'bg-red-950/30 text-red-300 border-red-700/40' },
  awaiting_validation: { label: 'Validation requise', dot: 'bg-amber-400 animate-pulse',  badge: 'bg-amber-950/30 text-amber-300 border-amber-700/40' },
}

function agentEmoji(id: string) {
  return AGENTS.find(a => a.id === id)?.emoji ?? '🤖'
}

// ─── Job Card ─────────────────────────────────────────────────────────────────

function JobCard({ job }: { job: AgentJob }) {
  const cfg = JOB_STATUS_CFG[job.status]
  const duration = job.completedAt
    ? job.completedAt - job.startedAt
    : Date.now() - job.startedAt

  return (
    <Link href={`/agents/jobs/${job.id}`} className="block group">
      <div className={`bg-gray-900/40 border rounded-xl p-4 hover:border-purple-700/50 transition-all ${
        job.status === 'running' ? 'border-purple-700/40 shadow-sm shadow-purple-900/20' :
        job.status === 'failed' ? 'border-red-800/40' :
        job.status === 'awaiting_validation' ? 'border-amber-700/40' :
        'border-gray-800'
      }`}>
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{job.clientEmoji ?? '🤖'}</span>
            <div>
              <div className="text-sm font-medium text-white">{job.clientName ?? job.clientId}</div>
              <div className="text-[11px] text-gray-500 truncate max-w-[200px]">{job.briefSummary}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            <span className={`text-[10px] border rounded-full px-2 py-0.5 ${cfg.badge}`}>{cfg.label}</span>
          </div>
        </div>

        {/* Pipeline mini-viz */}
        <div className="flex items-center gap-1 mb-3">
          {PIPELINE_AGENTS.map((step, i) => (
            <div key={step.id} className="flex items-center gap-1">
              <div className="text-base" title={step.id}>{agentEmoji(step.id)}</div>
              {i < PIPELINE_AGENTS.length - 1 && (
                <div className="w-4 h-px bg-gray-800" />
              )}
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between text-[10px] text-gray-600">
          <span>{since(job.startedAt)}{job.completedAt ? ` · ${elapsed(duration)}` : ''}</span>
          <span className="flex items-center gap-1 text-purple-500 group-hover:text-purple-400 transition-colors">
            Voir détail <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  )
}

// ─── Agent Registry Card ──────────────────────────────────────────────────────

const STATUS_INFO: Record<AgentStatus, { label: string; color: string }> = {
  active:  { label: 'ACTIF',   color: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40' },
  next:    { label: 'BIENTÔT', color: 'bg-amber-900/30 text-amber-300 border-amber-700/40' },
  planned: { label: 'PRÉVU',   color: 'bg-gray-800 text-gray-400 border-gray-700' },
}

function AgentCard({ agent }: { agent: MaestroAgent }) {
  const isActive = agent.status === 'active'
  const cfg = STATUS_INFO[agent.status]
  return (
    <article className={`rounded-2xl border p-5 ${isActive ? 'bg-gray-900/40 border-gray-800' : 'bg-gray-900/20 border-gray-800/60 opacity-75'}`}>
      <header className="flex items-start gap-3 mb-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-2xl shadow-lg flex-shrink-0`}>
          {agent.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-white">{agent.name}</h3>
            <span className={`text-[10px] border rounded-full px-2 py-0.5 ${cfg.color}`}>● {cfg.label}</span>
          </div>
          <p className="text-xs text-gray-400">{agent.role}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">🧠 {agent.model}</p>
        </div>
      </header>
      <p className="text-xs text-gray-300 leading-snug border-l-2 border-purple-700/40 pl-3 mb-3">
        {agent.specialty}
      </p>
      <div className="grid grid-cols-1 gap-2 text-[11px]">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Entrées</div>
          <div className="flex flex-wrap gap-1">
            {agent.inputs.map(i => <span key={i} className="px-1.5 py-0.5 rounded border text-blue-300 border-blue-700/40 bg-blue-950/20">{i}</span>)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Sorties</div>
          <div className="flex flex-wrap gap-1">
            {agent.outputs.map(o => <span key={o} className="px-1.5 py-0.5 rounded border text-purple-300 border-purple-700/40 bg-purple-950/20">{o}</span>)}
          </div>
        </div>
      </div>
    </article>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AgentsPage() {
  const allJobs = await listRecentJobs(30)

  const runningJobs = allJobs.filter(j => j.status === 'running')
  const errorJobs = allJobs.filter(j => j.status === 'failed' || j.status === 'awaiting_validation')
  const todayTs = new Date().setHours(0, 0, 0, 0)
  const todayJobs = allJobs.filter(j => j.status === 'completed' && j.startedAt >= todayTs)
  const recentJobs = allJobs.filter(j => j.status === 'completed' && j.startedAt < todayTs).slice(0, 6)

  const activeAgents = AGENTS.filter(a => a.status === 'active').sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
  const upcomingAgents = AGENTS.filter(a => a.status !== 'active')

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Bot aria-hidden="true" className="w-7 h-7 text-purple-400" />
            Agents
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activeAgents.length} agents actifs · {upcomingAgents.length} à venir
          </p>
        </div>
        <div className="flex gap-2">
          {runningJobs.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs bg-purple-950/40 border border-purple-700/40 text-purple-300 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              {runningJobs.length} en cours
            </span>
          )}
          {errorJobs.length > 0 && (
            <span className="flex items-center gap-1.5 text-xs bg-red-950/30 border border-red-700/40 text-red-300 rounded-full px-3 py-1">
              <AlertTriangle aria-hidden="true" className="w-3 h-3" />
              {errorJobs.length} erreur{errorJobs.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* ── Activité ── */}
      <section aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Activity aria-hidden="true" className="w-4 h-4 text-purple-400" />
          Activité en direct
        </h2>

        {/* En cours */}
        {runningJobs.length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 px-1">En cours</p>
            {runningJobs.map(j => <JobCard key={j.id} job={j} />)}
          </div>
        )}

        {/* Erreurs / Validation */}
        {errorJobs.length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 px-1">Attention requise</p>
            {errorJobs.map(j => <JobCard key={j.id} job={j} />)}
          </div>
        )}

        {/* Aujourd'hui */}
        {todayJobs.length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 px-1">Terminé aujourd&apos;hui ({todayJobs.length})</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {todayJobs.slice(0, 6).map(j => <JobCard key={j.id} job={j} />)}
            </div>
          </div>
        )}

        {/* Historique récent */}
        {recentJobs.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 px-1">Historique récent</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {recentJobs.map(j => <JobCard key={j.id} job={j} />)}
            </div>
          </div>
        )}

        {allJobs.length === 0 && (
          <EmptyState
            icon={Bot}
            title="Aucune activité enregistrée"
            description="Les activités apparaîtront ici dès que tu génères un post dans le Studio."
            cta={{ label: 'Créer un post', href: '/studio', icon: Sparkles }}
          />
        )}
      </section>

      {/* ── Pipeline visuel ── */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-3">🔗 Pipeline d&apos;exécution</h2>
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5, 6, 7].map(step => {
              const stepAgents = AGENTS.filter(a => a.order === step && a.status === 'active')
              return (
                <div key={step} className="flex items-center gap-2 flex-shrink-0">
                  <div className="bg-gray-950/50 border border-gray-800 rounded-lg p-2.5 min-w-[140px]">
                    <div className="text-[10px] text-purple-400 mb-1">ÉTAPE {step}</div>
                    {stepAgents.length > 0
                      ? stepAgents.map(a => (
                          <div key={a.id} className="text-xs text-white flex items-center gap-1.5">
                            <span>{a.emoji}</span>
                            <span className="truncate">{a.name.split(' · ')[0]}</span>
                          </div>
                        ))
                      : <div className="text-xs text-gray-600 italic">à venir</div>
                    }
                  </div>
                  {step < 7 && <span className="text-gray-700">→</span>}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Registre des agents ── */}
      <section aria-labelledby="registry-heading">
        <h2 id="registry-heading" className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <CheckCircle2 aria-hidden="true" className="w-4 h-4 text-emerald-400" />
          Agents actifs · {activeAgents.length}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activeAgents.map(agent => <AgentCard key={agent.id} agent={agent} />)}
        </div>
      </section>

      {upcomingAgents.length > 0 && (
        <section aria-labelledby="upcoming-heading">
          <h2 id="upcoming-heading" className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Clock aria-hidden="true" className="w-4 h-4 text-amber-400" />
            Agents à venir · {upcomingAgents.length}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcomingAgents.map(agent => <AgentCard key={agent.id} agent={agent} />)}
          </div>
        </section>
      )}

      <div className="bg-purple-950/20 border border-purple-700/30 rounded-2xl p-4 text-sm text-purple-200">
        <Sparkles aria-hidden="true" className="w-4 h-4 inline mr-1.5 text-purple-300" />
        Tous les agents Opus 4.7 utilisent <strong>adaptive thinking + effort high</strong> pour les tâches qualitatives.
      </div>
    </div>
  )
}
