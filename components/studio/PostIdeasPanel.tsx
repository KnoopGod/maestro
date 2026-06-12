'use client'

import { useState, useRef, useEffect } from 'react'
import { Lightbulb, Loader2, Sparkles, Wand2, Zap, CheckCircle2, XCircle } from 'lucide-react'
import type { PostIdea } from '@/lib/agents/planner'

interface PostIdeasPanelProps {
  clientId: string | null
  onPick: (idea: PostIdea) => void
}

interface BulkResult {
  done: number
  failed: number
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

    const queue = [...ideas]
    const workers = Array.from({ length: Math.min(2, queue.length) }, async () => {
      while (queue.length > 0 && !bulkCancelledRef.current) {
        const idea = queue.shift()
        if (!idea) return
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
      }
    })

    await Promise.all(workers)

    if (!bulkCancelledRef.current) {
      setBulkLoading(false)
      setBulkResult({ done, failed })
    }
  }

  return (
    <div className="bg-gradient-to-br from-purple-950/30 to-pink-950/20 border border-purple-700/30 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Idées de posts (Strategy Director)</h3>
        </div>
        <button
          onClick={generate}
          disabled={loading || bulkLoading || !clientId}
          title="Demander au Strategy Director de proposer 5 angles de posts adaptés au client sélectionné"
          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {ideas.length > 0 ? 'Régénérer' : 'Proposer 5 idées'}
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-300 bg-red-950/30 border border-red-700/30 rounded-lg p-2">{error}</div>
      )}

      {ideas.length === 0 && !loading && !error && (
        <p className="text-xs text-gray-400">
          Claude analyse la stratégie du client et propose 5 angles concrets, prêts à passer au générateur.
        </p>
      )}

      {ideas.length > 0 && (
        <div className="space-y-2">
          {ideas.map((idea, idx) => (
            <div
              key={idx}
              className="bg-gray-950/40 border border-gray-800 rounded-xl p-3 hover:border-purple-700/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-white">{idea.title}</span>
                    {idea.pillar && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/40 border border-purple-700/30 text-purple-300">
                        {idea.pillar}
                      </span>
                    )}
                    {idea.bestTime && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/30 border border-blue-700/30 text-blue-300">
                        ⏰ {idea.bestTime}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mb-1">{idea.objective}</p>
                  <p className="text-xs text-gray-300 line-clamp-2">{idea.brief}</p>
                </div>
                <button
                  onClick={() => onPick(idea)}
                  disabled={bulkLoading}
                  title={`Remplir le Studio avec cette idée : ${idea.title}`}
                  className="px-2.5 py-1 rounded-lg border border-purple-700/40 text-purple-300 hover:bg-purple-900/30 text-[11px] flex items-center gap-1 flex-shrink-0 disabled:opacity-40"
                >
                  <Wand2 className="w-3 h-3" />
                  Utiliser
                </button>
              </div>
            </div>
          ))}

          {/* Bulk generation footer */}
          <div className="pt-2 border-t border-gray-800/60 flex items-center justify-between gap-3">
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
                <a href="/plan" title="Voir les drafts générés dans l'historique et le calendrier" className="text-purple-400 hover:underline">
                  Voir les drafts →
                </a>
              </div>
            ) : (
              <button
                onClick={generateAllDrafts}
                disabled={bulkLoading || ideas.length === 0}
                title="Créer automatiquement un draft complet pour chaque idée proposée"
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700/30 border border-emerald-600/30 text-emerald-300 hover:bg-emerald-700/50 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
