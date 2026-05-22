'use client'
import { useState } from 'react'
import { Send, Loader2, Zap, GitBranch, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type AITarget = 'router' | 'ollama' | 'claude' | 'chatgpt'

interface Result {
  ai: string
  response?: string
  error?: string
  tokensUsed?: number
  cost?: number
  latencyMs?: number
  routingReason?: string
  taskType?: string
  savings?: number
}

const AI_STYLE: Record<string, { label: string; color: string; border: string; bg: string; dot: string }> = {
  router:  { label: '⚡ Auto-Router', color: 'text-purple-300', border: 'border-purple-600/50', bg: 'bg-purple-900/20', dot: 'bg-purple-500' },
  ollama:  { label: '🏠 Ollama',      color: 'text-amber-300',  border: 'border-amber-600/40',  bg: 'bg-amber-900/20',  dot: 'bg-amber-500'  },
  claude:  { label: '👑 Claude',      color: 'text-purple-300', border: 'border-purple-600/40', bg: 'bg-purple-900/20', dot: 'bg-purple-500' },
  chatgpt: { label: '🎨 ChatGPT',    color: 'text-emerald-300',border: 'border-emerald-600/40',bg: 'bg-emerald-900/20',dot: 'bg-emerald-500'},
}

const QUICK_PROMPTS = [
  { label: 'Hashtags', prompt: 'Génère 10 hashtags Instagram pour une marque fitness premium', expected: 'ollama' },
  { label: 'Stratégie', prompt: 'Propose une stratégie de lancement produit SaaS en 3 étapes', expected: 'claude' },
  { label: 'Code', prompt: 'Écris une fonction TypeScript qui calcule le coût en tokens', expected: 'claude' },
  { label: 'Résumé', prompt: 'Résume en 2 phrases ce qu\'est le machine learning', expected: 'ollama' },
]

export function LiveTest() {
  const [prompt, setPrompt] = useState('')
  const [target, setTarget] = useState<AITarget>('router')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)

  const handleSubmit = async (customPrompt?: string) => {
    const p = customPrompt ?? prompt
    if (!p.trim() || loading) return
    if (customPrompt) setPrompt(customPrompt)
    setLoading(true)
    setResult(null)
    const t0 = Date.now()

    const endpoint = target === 'router' ? '/api/router' : `/api/${target}`

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: p }),
      })
      const data = await res.json()
      setResult({ ...data, latencyMs: data.latencyMs ?? Date.now() - t0 })
    } catch {
      setResult({ ai: target, error: 'Erreur réseau', latencyMs: Date.now() - t0 })
    } finally {
      setLoading(false)
    }
  }

  const resultStyle = result?.ai ? (AI_STYLE[result.ai] ?? AI_STYLE.ollama) : null

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-gray-300">Test Live — IAs réelles</h3>
        <span className="ml-auto text-[10px] text-gray-600 bg-gray-800 px-2 py-0.5 rounded">API connectées</span>
      </div>

      {/* Target selector */}
      <div className="flex gap-1.5 flex-wrap">
        {(Object.keys(AI_STYLE) as AITarget[]).map((ai) => {
          const s = AI_STYLE[ai]
          return (
            <button
              key={ai}
              onClick={() => setTarget(ai)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-all
                ${target === ai ? `${s.bg} ${s.border} ${s.color}` : 'bg-gray-800 border-gray-700/50 text-gray-500 hover:text-gray-300 hover:bg-gray-700/50'}`}
            >
              {s.label}
            </button>
          )
        })}
      </div>

      {/* Quick prompts */}
      <div>
        <div className="text-[10px] text-gray-600 mb-2 uppercase tracking-wider">Tester rapidement</div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((qp) => (
            <button
              key={qp.label}
              onClick={() => handleSubmit(qp.prompt)}
              disabled={loading}
              className="text-[11px] px-2.5 py-1 rounded-md bg-gray-800 border border-gray-700/50 text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-all disabled:opacity-40"
            >
              {qp.label}
              <span className="ml-1.5 opacity-50">→ {qp.expected}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="Écris ta tâche ici — le router choisit la bonne IA"
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-gray-500 transition-colors"
        />
        <button
          onClick={() => handleSubmit()}
          disabled={loading || !prompt.trim()}
          className="px-4 py-2.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-40 transition-all flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>

      {/* Result */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 py-3 text-xs text-gray-400"
          >
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
            <span>
              {target === 'router' ? 'Analyse de la tâche et routing en cours…' : `Appel ${AI_STYLE[target].label} en cours…`}
            </span>
          </motion.div>
        )}

        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-4 space-y-3 ${result.error ? 'bg-red-950/30 border-red-800/40' : `${resultStyle?.bg} ${resultStyle?.border}`}`}
          >
            {result.error ? (
              <div className="text-red-400 text-xs">{result.error}</div>
            ) : (
              <>
                {/* Routing info */}
                {result.routingReason && (
                  <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                    <GitBranch className="w-3.5 h-3.5 text-gray-500" />
                    <span className={`text-xs font-semibold ${resultStyle?.color}`}>
                      Routé vers {result.ai?.charAt(0).toUpperCase() + result.ai?.slice(1)}
                    </span>
                    <span className="text-[11px] text-gray-500">— {result.routingReason}</span>
                  </div>
                )}

                {/* Response */}
                <div className="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {result.response}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${resultStyle?.dot}`} />
                    <span className="text-[11px] font-semibold text-gray-300">{result.ai}</span>
                  </div>
                  <span className="text-[11px] text-gray-500">{result.latencyMs}ms</span>
                  <span className="text-[11px] text-gray-500">{result.tokensUsed ?? 0} tokens</span>
                  <span className={`text-[11px] font-semibold ${result.cost === 0 ? 'text-emerald-400' : 'text-orange-300'}`}>
                    {result.cost === 0 ? '🟢 GRATUIT' : `$${result.cost?.toFixed(5)}`}
                  </span>
                  {(result.savings ?? 0) > 0 && (
                    <span className="text-[11px] text-purple-400 ml-auto">
                      Économisé ~${result.savings?.toFixed(5)} vs Claude
                    </span>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
