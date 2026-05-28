import { Bot, CheckCircle2, Clock, Sparkles } from 'lucide-react'
import { AGENTS, type AgentStatus, type MaestroAgent } from '@/lib/agent-registry'

export const dynamic = 'force-dynamic'

const STATUS_INFO: Record<AgentStatus, { label: string; color: string }> = {
  active:  { label: 'ACTIF',    color: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40' },
  next:    { label: 'BIENTÔT',  color: 'bg-amber-900/30 text-amber-300 border-amber-700/40' },
  planned: { label: 'PRÉVU',    color: 'bg-gray-800 text-gray-400 border-gray-700' },
}

export default function AgentsPage() {
  const active = AGENTS.filter(a => a.status === 'active')
  const upcoming = AGENTS.filter(a => a.status !== 'active')

  // Sort by order then by name within each section
  const sortedActive = [...active].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Bot className="w-7 h-7 text-purple-400" />
          Agents
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Le pipeline complet : {active.length} agents actifs, {upcoming.length} à venir
        </p>
        <p className="text-sm text-gray-400 mt-2 max-w-2xl">
          Vue de travail inspirée du prototype : chaque agent affiche son rôle, ses entrées,
          ses sorties, ses contrôles qualité et sa place dans la chaîne de production.
        </p>
      </div>

      {/* Pipeline visual */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3">🔗 Pipeline d&apos;exécution</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5, 6, 7].map(step => {
            const stepAgents = AGENTS.filter(a => a.order === step && a.status === 'active')
            return (
              <div key={step} className="flex items-center gap-2 flex-shrink-0">
                <div className="bg-gray-950/50 border border-gray-800 rounded-lg p-2.5 min-w-[140px]">
                  <div className="text-[10px] text-purple-400 mb-1">ÉTAPE {step}</div>
                  {stepAgents.length > 0 ? (
                    stepAgents.map(a => (
                      <div key={a.id} className="text-xs text-white flex items-center gap-1.5">
                        <span>{a.emoji}</span>
                        <span className="truncate">{a.name.split(' · ')[0]}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-600 italic">à venir</div>
                  )}
                </div>
                {step < 7 && <span className="text-gray-700">→</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Active agents */}
      <section>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Agents actifs · {active.length}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedActive.map(agent => <AgentCard key={agent.id} agent={agent} />)}
        </div>
      </section>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Agents à venir · {upcoming.length}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {upcoming.map(agent => <AgentCard key={agent.id} agent={agent} />)}
          </div>
        </section>
      )}

      <div className="bg-purple-950/20 border border-purple-700/30 rounded-2xl p-4 text-sm text-purple-200">
        <Sparkles className="w-4 h-4 inline mr-1.5 text-purple-300" />
        Tous les agents Opus 4.7 utilisent <strong>adaptive thinking + effort high</strong> pour les tâches qualitatives (synthèse, supervision, brand voice).
      </div>
    </div>
  )
}

function AgentCard({ agent }: { agent: MaestroAgent }) {
  const isActive = agent.status === 'active'
  const cfg = STATUS_INFO[agent.status]
  return (
    <article
      className={`relative overflow-hidden rounded-2xl border p-5 min-h-[330px] ${
        isActive ? 'bg-gray-900/40 border-gray-800' : 'bg-gray-900/20 border-gray-800/60 opacity-80'
      }`}
    >
      <PixelAgent agentId={agent.id} />

      <header className="relative z-10 flex items-start gap-3 mb-3 pr-20">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-2xl shadow-lg flex-shrink-0`}>
          {agent.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-semibold text-white">{agent.name}</h3>
            <span className={`text-[10px] border rounded-full px-2 py-0.5 ${cfg.color}`}>● {cfg.label}</span>
          </div>
          <p className="text-xs text-gray-400">{agent.role}</p>
          <p className="text-[10px] text-gray-500 mt-1">🧠 {agent.model}</p>
        </div>
      </header>

      <p className="relative z-10 text-xs text-gray-300 leading-snug border-l-2 border-purple-700/40 pl-3 mb-4 pr-16">
        {agent.specialty}
      </p>

      <div className="relative z-10 grid grid-cols-1 gap-3 mb-3 text-[11px]">
        <Row label="Entrées" items={agent.inputs} color="text-blue-300 border-blue-700/40 bg-blue-950/20" />
        <Row label="Sorties" items={agent.outputs} color="text-purple-300 border-purple-700/40 bg-purple-950/20" />
        <Row label="Contrôles qualité" items={agent.qualityChecks} color="text-emerald-300 border-emerald-700/40 bg-emerald-950/20" />
      </div>

      {agent.file && (
        <div className="relative z-10 text-[10px] text-gray-600 mt-2">
          📄 <code>{agent.file}</code>
        </div>
      )}
    </article>
  )
}

function PixelAgent({ agentId }: { agentId: string }) {
  return (
    <div className={`pixelAgent ${agentId}`} aria-hidden="true">
      <span className="pixelHead" />
      <span className="pixelBody" />
      <span className="pixelArm left" />
      <span className="pixelArm right" />
      <span className="pixelTool" />
    </div>
  )
}

function Row({ label, items, color }: { label: string; items: string[]; color: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map(i => (
          <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded border ${color}`}>{i}</span>
        ))}
      </div>
    </div>
  )
}
