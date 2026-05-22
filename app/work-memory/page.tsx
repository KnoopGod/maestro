'use client'
import { useState } from 'react'
import { WORK_SESSIONS } from '@/lib/mock-data/work-memory'
import { WorkSession } from '@/types'
import { CheckCircle, Clock, Pause, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const AI_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  claude:  { label: 'Claude',  color: 'text-purple-300', bg: 'bg-purple-900/50 border-purple-700/40' },
  chatgpt: { label: 'ChatGPT', color: 'text-emerald-300', bg: 'bg-emerald-900/50 border-emerald-700/40' },
  ollama:  { label: 'Ollama',  color: 'text-amber-300', bg: 'bg-amber-900/50 border-amber-700/40' },
}

const STATUS_CONFIG = {
  completed: { icon: CheckCircle, color: 'text-green-400',  bg: 'bg-green-900/30 border-green-700/40',  label: 'Terminé' },
  active:    { icon: Clock,       color: 'text-blue-400',   bg: 'bg-blue-900/30 border-blue-700/40',    label: 'En cours' },
  paused:    { icon: Pause,       color: 'text-orange-400', bg: 'bg-orange-900/30 border-orange-700/40', label: 'En pause' },
}

function SessionCard({ session }: { session: WorkSession }) {
  const [expanded, setExpanded] = useState(session.status === 'active')
  const cfg = STATUS_CONFIG[session.status]
  const Icon = cfg.icon

  return (
    <motion.div
      layout
      className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className={`mt-0.5 px-2 py-1 rounded-md border text-[10px] font-semibold flex items-center gap-1.5 flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
          <Icon className="w-3 h-3" />
          {cfg.label}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-200">{session.mission}</div>
          <div className="text-xs text-gray-500 mt-0.5">{session.project} · {session.date}</div>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {session.aiSequence.map((ai, i) => {
              const s = AI_STYLE[ai]
              return (
                <span key={`${ai}-${i}`} className="flex items-center gap-1">
                  {i > 0 && <ArrowRight className="w-3 h-3 text-gray-600" />}
                  <span className={`text-[10px] font-semibold ${s.color}`}>{s.label}</span>
                </span>
              )
            })}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className="text-sm font-bold text-gray-300">${session.estimatedCost.toFixed(2)}</span>
          {session.savings > 0 && (
            <span className="text-[10px] text-emerald-400">-${session.savings.toFixed(2)} économisé</span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-600 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-600 mt-1" />}
        </div>
      </button>

      {/* Expanded timeline */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-800"
          >
            <div className="p-5 space-y-4">
              {/* Steps timeline */}
              <div className="space-y-3">
                {session.steps.map((step, i) => {
                  const s = AI_STYLE[step.ai]
                  return (
                    <div key={step.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full border text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${s.bg} ${s.color}`}>
                          {i + 1}
                        </div>
                        {i < session.steps.length - 1 && (
                          <div className="w-px flex-1 bg-gray-800 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold ${s.color}`}>{s.label}</span>
                          <span className="text-xs text-gray-500">— {step.action}</span>
                          <span className="text-[10px] text-gray-600 ml-auto">{step.timestamp}</span>
                        </div>
                        <div className="text-[11px] text-gray-500 mb-1">
                          <span className="text-gray-600">Prompt : </span>{step.promptSummary}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          <span className="text-gray-600">Résultat : </span>
                          {step.status === 'in_progress'
                            ? <span className="text-blue-400 animate-pulse">En cours…</span>
                            : step.outputSummary}
                        </div>
                        {step.tokensUsed > 0 && (
                          <div className="text-[10px] text-gray-600 mt-1">{step.tokensUsed.toLocaleString()} tokens</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Summary + next action */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-800">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Résumé</div>
                  <div className="text-xs text-gray-300">{session.summary}</div>
                </div>
                <div className="bg-purple-900/20 border border-purple-800/30 rounded-lg p-3">
                  <div className="text-[10px] text-purple-500 uppercase tracking-wider mb-1">Prochaine action</div>
                  <div className="text-xs text-purple-300">{session.nextAction}</div>
                </div>
              </div>

              {/* Token stats */}
              <div className="flex items-center gap-6 pt-2 text-xs text-gray-500">
                <span>Tokens : <strong className="text-gray-300">{session.tokensUsed.toLocaleString()}</strong></span>
                <span>Coût : <strong className="text-gray-300">${session.estimatedCost.toFixed(2)}</strong></span>
                {session.savings > 0 && <span>Économies : <strong className="text-emerald-400">${session.savings.toFixed(2)}</strong></span>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function WorkMemoryPage() {
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'completed'>('all')

  const filtered = filter === 'all'
    ? WORK_SESSIONS
    : WORK_SESSIONS.filter(s => s.status === filter)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Work Memory</h1>
        <p className="text-sm text-gray-500 mt-0.5">Historique et contexte de chaque session de travail</p>
      </div>

      <div className="flex gap-2">
        {(['all', 'active', 'paused', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all
              ${filter === f ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            {f === 'all' ? 'Toutes' : f === 'active' ? 'En cours' : f === 'paused' ? 'En pause' : 'Terminées'}
            <span className="ml-1.5 text-[10px] opacity-60">
              {f === 'all' ? WORK_SESSIONS.length : WORK_SESSIONS.filter(s => s.status === f).length}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    </div>
  )
}
