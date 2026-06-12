'use client'

import { usePathname } from 'next/navigation'
import { Bot, Loader2, Send, X } from 'lucide-react'
import { useMemo, useState, useTransition } from 'react'
import { resolvePageAgent, type PageAgentProfile } from '@/lib/agents/page-agent-registry'

interface PageAgentResponse {
  agent: PageAgentProfile
  answer: string
  nextActions: string[]
  risks: string[]
  cost: number
  model: string
}

const HIDDEN_PREFIXES = ['/login', '/privacy', '/data-deletion', '/portal']

export function PageAgentCopilot() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [result, setResult] = useState<PageAgentResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const pathWithQuery = useMemo(() => pathname, [pathname])
  const agent = resolvePageAgent(pathname)
  const hidden = HIDDEN_PREFIXES.some(prefix => pathname.startsWith(prefix))
  if (hidden) return null

  const submit = () => {
    const text = prompt.trim()
    if (!text) return
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/agents/page-command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: pathWithQuery, prompt: text }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur agent')
        setResult(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      }
    })
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 lg:bottom-6">
      {open && (
        <div className="mb-3 w-[min(92vw,420px)] border border-indigo-800/50 bg-[#090A18] shadow-2xl shadow-black/50">
          <div className="flex items-start justify-between gap-3 border-b border-indigo-950/70 p-4">
            <div className="min-w-0">
              <div className="text-[9px] font-mono uppercase tracking-[0.28em] text-indigo-500/70">
                Agent de page
              </div>
              <h2 className="mt-1 text-sm font-semibold text-white">{agent.name}</h2>
              <p className="mt-0.5 text-xs text-gray-500">{agent.role}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer l'agent de page"
              title="Fermer l'agent de page"
              className="flex h-8 w-8 items-center justify-center border border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 p-4">
            <div className="rounded border border-gray-800 bg-gray-950/60 p-3">
              <div className="text-[10px] uppercase tracking-wider text-gray-600">Spécialité</div>
              <p className="mt-1 text-xs leading-relaxed text-gray-300">{agent.specialty}</p>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-[11px] text-gray-500">Donne un ordre à cet agent</span>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={4}
                placeholder="Ex: Analyse cette page et dis-moi quoi améliorer pour publier plus vite."
                className="w-full resize-none border border-gray-800 bg-gray-950/70 px-3 py-2 text-sm text-white outline-none placeholder:text-gray-700 focus:border-indigo-600"
              />
            </label>

            <button
              type="button"
              onClick={submit}
              disabled={isPending || !prompt.trim()}
              title="Envoyer l'ordre à l'agent responsable de cette page"
              className="flex w-full items-center justify-center gap-2 bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Envoyer à {agent.name}
            </button>

            {error && (
              <p className="rounded border border-red-800/40 bg-red-950/30 p-2 text-xs text-red-300">{error}</p>
            )}

            {result && (
              <div className="space-y-3 border-t border-gray-800 pt-3">
                <p className="text-sm leading-relaxed text-gray-200">{result.answer}</p>
                {result.nextActions.length > 0 && (
                  <div>
                    <div className="mb-1 text-[10px] uppercase tracking-wider text-emerald-500/70">Actions proposées</div>
                    <ul className="space-y-1">
                      {result.nextActions.map(action => (
                        <li key={action} className="text-xs text-gray-300">- {action}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.risks.length > 0 && (
                  <div>
                    <div className="mb-1 text-[10px] uppercase tracking-wider text-amber-500/70">Points de vigilance</div>
                    <ul className="space-y-1">
                      {result.risks.map(risk => (
                        <li key={risk} className="text-xs text-gray-400">- {risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="text-[10px] font-mono text-gray-600">
                  {result.model} · ${result.cost.toFixed(4)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        title={`Parler à ${agent.name}, l'agent responsable de cette page`}
        className="flex min-h-[48px] items-center gap-2 border border-indigo-700/50 bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/50 transition-colors hover:bg-indigo-500"
      >
        <Bot className="h-5 w-5" />
        <span className="hidden sm:inline">{agent.name}</span>
      </button>
    </div>
  )
}
