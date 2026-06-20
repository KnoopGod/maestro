'use client'

import { useState, useRef, useEffect } from 'react'
import { Lightbulb, Loader2, Sparkles, Wand2, Zap, CheckCircle2, XCircle, Clock, Target } from 'lucide-react'
import type { PostIdea } from '@/lib/agents/planner'

interface PostIdeasPanelProps {
  clientId: string | null
  onPick: (idea: PostIdea) => void
}

interface BulkResult {
  done: number
  failed: number
}

const PILLAR_COLORS: Record<string, string> = {
  engagement: 'bg-purple-900/40 border-purple-700/40 text-purple-300',
  promotion: 'bg-pink-900/40 border-pink-700/40 text-pink-300',
  éducation: 'bg-blue-900/40 border-blue-700/40 text-blue-300',
  inspiration: 'bg-amber-900/40 border-amber-700/40 text-amber-300',
  communauté: 'bg-emerald-900/40 border-emerald-700/40 text-emerald-300',
}

function getPillarColor(pillar: string): string {
  const key = pillar.toLowerCase()
  for (const [k, v] of Object.entries(PILLAR_COLORS)) {
    if (key.includes(k)) return v
  }
  return 'bg-gray-800/60 border-gray-700/40 text-gray-300'
}

export function PostIdeasPanel({ clientId, onPick }: PostIdeasPanelProps) {
  const [loading, setLoading] = useState(false)
  const [ideas, setIdeas] = useState<PostIdea[]>([])
  const [error, setError] = useState('')
  const [meta, setMeta] = useState<{ model: string; cost: number } | null>(null)

  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkProgress, setBulkProgress] = useState(0)
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null)
  const bulkCancelledRef = useRef(false)
  useEffect(() => () => { bulkCancelledRef.current = true }, [])

  async function generate() {
    if (!clientId) {
      setError('Sélectionne un client d\'abord')
      return
    }
    setLoading(true)
    setError('')
    setBulkResult(null)
    try {
      const res = await fetch('/api/posts/propose', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ clientId, count: 5 }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setIdeas(data.ideas)
      setMeta({ model: data.model, cost: data.cost })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur planner')
    } finally {
      setLoading(false)
    }
  }

  async function generateAllDrafts() {
    if (!clientId || ideas.length === 0) return
    bulkCancelledRef.current = false
    setBulkLoading(true)
    setBulkProgress(0)
    setBulkResult(null)

    let done = 0
    let failed = 0

    await Promise.all(
      ideas.map(async idea => {
        try {
          const res = await fetch('/api/studio/generate-post', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              clientId,
              brief: idea.brief,
              platforms: idea.platforms.length > 0 ? idea.platforms : ['instagram'],
              contentType: 'photo',
            }),
          })
          if (res.ok) done++
          else failed++
        } catch {
          failed++
        }
        if (!bulkCancelledRef.current) setBulkProgress(prev => prev + 1)
      })
    )

    if (!bulkCancelledRef.current) {
      setBulkLoading(false)
      setBulkResult({ done, failed })
    }
  }

  return (
    <div className="bg-gradient-to-br from-purple-950/30 to-pink-950/20 border border-purple-700/30 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-900/40 border border-purple-700/30 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Idées de posts</h3>
            <p className="text-[11px] text-gray-500">Strategy Director</p>
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading || bulkLoading || !clientId}
          title="Demander au Strategy Director de proposer 5 angles de posts adaptés au client sélectionné"
          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 active:scale-[0.98] text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {ideas.length > 0 ? 'Régénérer' : 'Proposer 5 idées'}
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-300 bg-red-950/30 border border-red-700/30 rounded-lg p-3 flex items-center gap-2">
          <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {ideas.length === 0 && !loading && !error && (
        <div className="text-center py-4">
          <Lightbulb className="w-8 h-8 text-gray-700 mx-auto mb-2" />
          <p className="text-xs text-gray-400 leading-relaxed">
            Claude analyse la stratégie du client et propose 5 angles concrets, prêts à passer au générateur.
          </p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-4 text-xs text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
          Analyse en cours...
        </div>
      )}

      {ideas.length > 0 && (
        <div className="space-y-2">
          {ideas.map((idea, idx) => (
            <div
              key={idx}
              className="bg-gray-950/50 border border-gray-800 rounded-xl p-3.5 hover:border-purple-700/50 hover:bg-gray-950/70 transition-all duration-150"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-sm font-semibold text-white">{idea.title}</span>
                    {idea.pillar && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getPillarColor(idea.pillar)} flex items-center gap-1`}>
                        <Target className="w-2.5 h-2.5" />
                        {idea.pillar}
                      </span>
                    )}
                    {idea.bestTime && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full border bg-blue-900/30 border-blue-700/30 text-blue-300 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {idea.bestTime}
                      </span>
                    )}
                  </div>
                  {idea.objective && (
                    <p className="text-xs text-gray-500 mb-1.5 font-medium">{idea.objective}</p>
                  )}
                  <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">{idea.brief}</p>
                </div>
                <button
                  onClick={() => onPick(idea)}
                  disabled={bulkLoading}
                  title={`Remplir le Studio avec cette idée : ${idea.title}`}
                  className="px-2.5 py-1.5 rounded-lg border border-purple-700/40 text-purple-300 hover:bg-purple-900/40 hover:border-purple-600/60 text-xs flex items-center gap-1.5 flex-shrink-0 disabled:opacity-40 transition-all duration-150 active:scale-[0.97]"
                >
                  <Wand2 className="w-3 h-3" />
                  Utiliser
                </button>
              </div>
            </div>
          ))}

          {/* Bulk generation footer */}
          <div className="pt-3 border-t border-gray-800/60 flex items-center justify-between gap-3">
            {meta && (
              <p className="text-[10px] text-gray-600">
                {meta.model} · ${meta.cost.toFixed(4)}
              </p>
            )}

            {bulkResult ? (
              <div className="flex items-center gap-3 text-xs ml-auto">
                {bulkResult.done > 0 && (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {bulkResult.done} draft{bulkResult.done > 1 ? 's' : ''} créé{bulkResult.done > 1 ? 's' : ''}
                  </span>
                )}
                {bulkResult.failed > 0 && (
                  <span className="flex items-center gap-1 text-red-400">
                    <XCircle className="w-3.5 h-3.5" />
                    {bulkResult.failed} échec{bulkResult.failed > 1 ? 's' : ''}
                  </span>
                )}
                <a href="/plan" title="Voir les drafts générés dans l'historique et le calendrier" className="text-purple-400 hover:text-purple-300 hover:underline transition-colors">
                  Voir les drafts →
                </a>
              </div>
            ) : (
              <button
                onClick={generateAllDrafts}
                disabled={bulkLoading || ideas.length === 0}
                title="Créer automatiquement un draft complet pour chaque idée proposée"
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/30 border border-emerald-600/30 text-emerald-300 hover:bg-emerald-700/50 hover:border-emerald-600/50 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.98]"
              >
                {bulkLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {bulkProgress}/{ideas.length}
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    Générer les {ideas.length} drafts
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
