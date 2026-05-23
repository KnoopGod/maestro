'use client'

import { useState } from 'react'
import { BarChart3, Loader2, TrendingUp, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import type { Client } from '@/types/client'

interface PerformanceAnalysis {
  topPerformers: string[]
  patterns: string[]
  recommendations: string[]
  summary: string
}

interface PerformancePanelProps {
  clients: Client[]
}

export function PerformancePanel({ clients }: PerformancePanelProps) {
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id ?? '')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<PerformanceAnalysis | null>(null)
  const [meta, setMeta] = useState<{ postsAnalyzed: number; postsWithInsights: number; cost: number; model: string } | null>(null)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(true)

  async function runAnalysis() {
    if (!selectedClientId) return
    setLoading(true)
    setError('')
    setAnalysis(null)
    try {
      const res = await fetch(`/api/clients/${selectedClientId}/performance`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur analyse')
      setAnalysis(data.analysis)
      setMeta({
        postsAnalyzed: data.postsAnalyzed,
        postsWithInsights: data.postsWithInsights,
        cost: data.cost,
        model: data.model,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  if (clients.length === 0) {
    return (
      <div className="bg-violet-950/20 border border-violet-700/30 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-5 h-5 text-violet-400" />
          <h2 className="text-base font-semibold text-white">Performance Analyst</h2>
          <span className="text-[10px] bg-violet-600/20 text-violet-300 border border-violet-700/30 rounded-full px-2 py-0.5">AGENT #7</span>
        </div>
        <p className="text-sm text-gray-500">Aucun post publié pour l&apos;instant. Publiez des posts pour obtenir des insights.</p>
      </div>
    )
  }

  return (
    <div className="bg-violet-950/20 border border-violet-700/30 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-violet-900/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-violet-400" />
          <h2 className="text-base font-semibold text-white">Performance Analyst</h2>
          <span className="text-[10px] bg-violet-600/20 text-violet-300 border border-violet-700/30 rounded-full px-2 py-0.5">AGENT #7</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>

      {expanded && (
        <div className="px-6 pb-6 space-y-4">
          <p className="text-xs text-gray-500">
            Analyse les métriques Meta de vos posts publiés et génère 3 recommandations actionnables pour améliorer les prochains.
          </p>

          <div className="flex items-center gap-3">
            <select
              value={selectedClientId}
              onChange={e => { setSelectedClientId(e.target.value); setAnalysis(null); setError('') }}
              className="flex-1 bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </select>
            <button
              onClick={runAnalysis}
              disabled={loading || !selectedClientId}
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
              {loading ? 'Analyse...' : 'Analyser'}
            </button>
          </div>

          {error && (
            <div className="text-sm text-red-300 bg-red-950/30 border border-red-700/30 rounded-lg p-3">{error}</div>
          )}

          {analysis && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-violet-950/30 border border-violet-700/20 rounded-xl p-4">
                <p className="text-sm text-gray-200">{analysis.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Top performers */}
                {analysis.topPerformers.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" /> Top performers
                    </h3>
                    <ul className="space-y-1.5">
                      {analysis.topPerformers.map((item, i) => (
                        <li key={i} className="text-xs text-gray-300 flex gap-2">
                          <span className="text-emerald-500 flex-shrink-0">▲</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Patterns */}
                {analysis.patterns.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5" /> Patterns
                    </h3>
                    <ul className="space-y-1.5">
                      {analysis.patterns.map((item, i) => (
                        <li key={i} className="text-xs text-gray-300 flex gap-2">
                          <span className="text-blue-500 flex-shrink-0">→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" /> Recommandations
                </h3>
                <div className="space-y-2">
                  {analysis.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-3 bg-amber-950/20 border border-amber-700/20 rounded-lg p-3">
                      <span className="w-5 h-5 rounded-full bg-amber-700/40 text-amber-300 text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-xs text-gray-200">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {meta && (
                <p className="text-[10px] text-gray-600 text-right">
                  {meta.postsAnalyzed} posts analysés · {meta.postsWithInsights} avec insights Meta · {meta.model} · ${meta.cost.toFixed(4)}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
