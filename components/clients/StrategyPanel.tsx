'use client'
import { useState } from 'react'
import type React from 'react'
import { Loader2, Sparkles, RefreshCw, ChevronDown, ChevronUp, Target, Lightbulb, Calendar, Hash, XCircle } from 'lucide-react'
import type { StrategyAdvice } from '@/lib/agents/strategy-advisor'

export function StrategyPanel({ clientId, initial }: { clientId: string; initial: StrategyAdvice | null }) {
  const [strategy, setStrategy] = useState<StrategyAdvice | null>(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string | null>('pillars')

  async function generate() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/clients/${clientId}/strategy`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setStrategy(data.strategy)
      setExpanded('pillars')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  if (!strategy) {
    return (
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-400" />
            Stratégie IA
          </h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Génère une stratégie marketing complète basée sur le profil de ce client — piliers de contenu, plan mensuel, hashtags, messages clés.
        </p>
        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
        <button
          onClick={generate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyse en cours...</> : <><Sparkles className="w-4 h-4" /> Analyser et générer la stratégie</>}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Target className="w-4 h-4 text-purple-400" />
          Stratégie IA
        </h2>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Régénérer
        </button>
      </div>

      {/* Positioning */}
      <div className="bg-purple-950/30 border border-purple-800/30 rounded-xl p-3">
        <p className="text-xs text-purple-300 font-medium mb-1">Positionnement</p>
        <p className="text-sm text-white">{strategy.positioning}</p>
        <p className="text-xs text-gray-400 mt-1">{strategy.uniqueAngle}</p>
      </div>

      {/* Quick wins */}
      <div className="flex flex-wrap gap-1.5">
        {strategy.quickWins?.map((w, i) => (
          <span key={i} className="text-[11px] px-2 py-1 rounded-full bg-emerald-900/30 border border-emerald-700/30 text-emerald-300">
            ⚡ {w}
          </span>
        ))}
      </div>

      {/* Content pillars */}
      <StrategySection expanded={expanded} setExpanded={setExpanded} id="pillars" icon={<Lightbulb className="w-4 h-4 text-amber-400" />} title={`Piliers de contenu (${strategy.contentPillars?.length ?? 0})`}>
        {strategy.contentPillars?.map((p, i) => (
          <div key={i} className="border border-gray-800 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">{p.name}</span>
              <span className="text-[10px] text-purple-300 bg-purple-900/30 px-2 py-0.5 rounded-full">{p.frequency}</span>
            </div>
            <p className="text-xs text-gray-400">{p.description}</p>
            <div className="space-y-1">
              {p.examples?.map((ex, j) => (
                <div key={j} className="text-[11px] text-gray-300 bg-gray-950/40 rounded px-2.5 py-1.5">
                  💡 {ex}
                </div>
              ))}
            </div>
          </div>
        ))}
      </StrategySection>

      {/* Platform strategy */}
      <StrategySection expanded={expanded} setExpanded={setExpanded} id="platforms" icon={<span className="text-sm">📱</span>} title="Par plateforme">
        {strategy.platformStrategy?.map((p, i) => (
          <div key={i} className="border border-gray-800 rounded-xl p-3">
            <div className="font-medium text-sm text-white capitalize mb-1">{p.platform}</div>
            <div className="text-xs text-gray-400 space-y-1">
              <p>🕐 {p.bestTimes}</p>
              <p>💬 {p.tone}</p>
              <p>📌 {p.specificTips}</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {p.contentTypes?.map((t, j) => (
                  <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300">{t}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </StrategySection>

      {/* Monthly plan */}
      <StrategySection expanded={expanded} setExpanded={setExpanded} id="plan" icon={<Calendar className="w-4 h-4 text-blue-400" />} title="Plan mensuel">
        <div className="grid grid-cols-2 gap-2">
          {strategy.monthlyPlan?.map((w, i) => (
            <div key={i} className="border border-gray-800 rounded-xl p-3">
              <div className="text-xs font-semibold text-purple-300 mb-1">{w.week}</div>
              <div className="text-[11px] text-gray-400 font-medium mb-1.5">🎯 {w.focus}</div>
              {w.postIdeas?.map((idea, j) => (
                <div key={j} className="text-[10px] text-gray-500 mb-0.5">• {idea}</div>
              ))}
            </div>
          ))}
        </div>
      </StrategySection>

      {/* Hashtags */}
      <StrategySection expanded={expanded} setExpanded={setExpanded} id="hashtags" icon={<Hash className="w-4 h-4 text-cyan-400" />} title="Clusters hashtags">
        {strategy.hashtagClusters?.map((c, i) => (
          <div key={i}>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">{c.theme}</div>
            <div className="flex flex-wrap gap-1.5">
              {c.tags?.map((tag, j) => (
                <span key={j} className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-900/20 border border-cyan-800/30 text-cyan-300">{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </StrategySection>

      {/* Key messages */}
      <StrategySection expanded={expanded} setExpanded={setExpanded} id="messages" icon={<span className="text-sm">💬</span>} title="Messages clés">
        {strategy.keyMessages?.map((m, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-gray-200">
            <span className="text-purple-400 mt-0.5">→</span> {m}
          </div>
        ))}
      </StrategySection>

      {/* Do not do */}
      <StrategySection expanded={expanded} setExpanded={setExpanded} id="donot" icon={<XCircle className="w-4 h-4 text-red-400" />} title="À éviter absolument">
        {strategy.doNotDo?.map((d, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-red-300">
            <span className="mt-0.5">✕</span> {d}
          </div>
        ))}
      </StrategySection>

      {strategy.cost > 0 && (
        <p className="text-[10px] text-gray-600 text-right">Coût IA : ${strategy.cost.toFixed(4)}</p>
      )}
    </div>
  )
}

function StrategySection({
  id,
  icon,
  title,
  children,
  expanded,
  setExpanded,
}: {
  id: string
  icon: React.ReactNode
  title: string
  children: React.ReactNode
  expanded: string | null
  setExpanded: (id: string | null) => void
}) {
  const open = expanded === id
  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(open ? null : id)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-950/40 hover:bg-gray-900/40 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-white">
          {icon} {title}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      {open && <div className="px-4 py-4 space-y-3">{children}</div>}
    </div>
  )
}
