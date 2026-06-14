'use client'
import { useState } from 'react'
import { BrainCircuit, ChevronDown, Loader2, Link as LinkIcon } from 'lucide-react'
import type { BriefFields, GenerationResult } from '@/lib/studio/types'
import { BRIEF_TEMPLATES } from '@/lib/studio/brief-templates'
import { GuidedBriefField } from './GuidedBriefField'

interface Props {
  clientId: string
  aiLoading: boolean
  aiDirective: GenerationResult['directive'] | null
  briefFields: BriefFields
  brief: string
  templateCategory: string | null
  onSuggestBrief: () => void
  onUpdateField: (key: keyof BriefFields, value: string) => void
  onApplyTemplate: (text: string) => void
  onSetTemplateCategory: (cat: string | null) => void
}

export function BriefCard({
  clientId, aiLoading, aiDirective, briefFields, brief, templateCategory,
  onSuggestBrief, onUpdateField, onApplyTemplate, onSetTemplateCategory,
}: Props) {
  const [showUrlPanel, setShowUrlPanel] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlError, setUrlError] = useState('')
  const [urlResult, setUrlResult] = useState<{ title: string; keyPoints: string[]; suggestedPillar: string | null } | null>(null)

  async function analyzeUrl() {
    if (!urlInput.trim() || !clientId) return
    setUrlLoading(true)
    setUrlError('')
    setUrlResult(null)
    try {
      const res = await fetch('/api/studio/brief-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim(), clientId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur analyse URL')
      onApplyTemplate(data.brief)
      setUrlResult({ title: data.title, keyPoints: data.keyPoints, suggestedPillar: data.suggestedPillar })
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setUrlLoading(false)
    }
  }

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="text-sm font-semibold text-white">✍️ Ordre pour le post</label>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => { setShowUrlPanel(v => !v); setUrlError(''); setUrlResult(null) }}
            disabled={!clientId}
            title="Générer un brief à partir d'une URL (événement, menu, article…)"
            className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed font-mono tracking-wide ${
              showUrlPanel
                ? 'bg-indigo-900/40 border-indigo-600/40 text-indigo-300'
                : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:bg-gray-700/60 hover:text-gray-200'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            Depuis URL
          </button>
          <button
            type="button"
            onClick={onSuggestBrief}
            disabled={!clientId || aiLoading}
            title="Demander à l'Account Director de proposer un brief aligné avec la stratégie du client"
            className="flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-lg bg-purple-900/40 border border-purple-700/40 text-purple-300 hover:bg-purple-800/40 hover:border-purple-500/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-mono tracking-wide"
          >
            {aiLoading
              ? <><Loader2 className="w-3 h-3 animate-spin" /> Analyse en cours...</>
              : <><BrainCircuit className="w-3 h-3" /> Brief IA</>
            }
          </button>
        </div>
      </div>

      {showUrlPanel && (
        <div className="bg-indigo-950/20 border border-indigo-700/30 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !urlLoading && analyzeUrl()}
              placeholder="https://..."
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-sm text-gray-200 placeholder-gray-600 focus:border-indigo-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={analyzeUrl}
              disabled={!urlInput.trim() || urlLoading}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-40"
            >
              {urlLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LinkIcon className="w-3.5 h-3.5" />}
              Analyser
            </button>
          </div>
          {urlError && <p className="text-xs text-red-400">{urlError}</p>}
          {urlResult && (
            <div className="space-y-1.5 text-xs">
              {urlResult.title && <p className="font-medium text-indigo-300">{urlResult.title}</p>}
              {urlResult.keyPoints.length > 0 && (
                <ul className="space-y-0.5 text-gray-400">
                  {urlResult.keyPoints.map((p, i) => <li key={i}>· {p}</li>)}
                </ul>
              )}
              {urlResult.suggestedPillar && (
                <span className="inline-block text-[10px] bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 rounded-full px-2 py-0.5">
                  Pilier suggéré : {urlResult.suggestedPillar}
                </span>
              )}
              <p className="text-emerald-400">Brief pré-rempli ✓</p>
            </div>
          )}
        </div>
      )}

      {aiDirective && (
        <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg p-3 space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[10px] tracking-wider">
            <BrainCircuit className="w-3 h-3" />
            Account Director — {aiDirective.priorityPillar}
          </div>
          <p className="text-gray-300">{aiDirective.rationale}</p>
          <p className="text-amber-300/80">Hook : &ldquo;{aiDirective.hookSuggestion}&rdquo;</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        <GuidedBriefField label="Sujet" value={briefFields.subject} onChange={v => onUpdateField('subject', v)} placeholder="Ex: présenter la guesthouse Pink House et son ambiance tropicale" />
        <GuidedBriefField label="Objectif" value={briefFields.objective} onChange={v => onUpdateField('objective', v)} placeholder="Ex: obtenir des demandes de réservation pour le week-end" />
        <GuidedBriefField label="Ton" value={briefFields.tone} onChange={v => onUpdateField('tone', v)} placeholder="Ex: premium, chaleureux, local, calme" />
        <GuidedBriefField label="À inclure" value={briefFields.includes} onChange={v => onUpdateField('includes', v)} placeholder="Ex: plage proche, piscine, CTA réservation, éviter ton trop touristique" />
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
        <div className="text-[9px] text-gray-600 font-mono uppercase tracking-wider mb-1">Brief envoyé aux agents</div>
        <p className="text-xs text-gray-400 whitespace-pre-wrap">{brief || 'Complète au moins le sujet pour guider les agents.'}</p>
      </div>

      <div className="space-y-2">
        <p className="text-[9px] text-gray-600 font-mono uppercase tracking-wider">Templates rapides</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(BRIEF_TEMPLATES).map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => onSetTemplateCategory(templateCategory === cat ? null : cat)}
              title={`Afficher les modèles rapides pour ${cat}`}
              className={`text-[10px] px-2.5 py-1 rounded-md border font-mono tracking-wide transition-all flex items-center gap-1 ${
                templateCategory === cat
                  ? 'bg-indigo-900/50 border-indigo-600/60 text-indigo-200'
                  : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:bg-gray-700/60 hover:text-gray-200'
              }`}
            >
              {cat}
              <ChevronDown className={`w-3 h-3 transition-transform ${templateCategory === cat ? 'rotate-180' : ''}`} />
            </button>
          ))}
        </div>

        {templateCategory && (
          <div className="grid grid-cols-1 gap-1.5 pt-1">
            {BRIEF_TEMPLATES[templateCategory].map(tpl => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => { onApplyTemplate(tpl.text); onSetTemplateCategory(null) }}
                title={`Utiliser ce modèle de brief : ${tpl.label}`}
                className="text-left text-xs px-3 py-2 rounded-lg bg-gray-900/60 border border-gray-700 text-gray-300 hover:border-purple-600/50 hover:bg-purple-950/20 hover:text-purple-200 transition-all"
              >
                <span className="font-medium">{tpl.label}</span>
                <span className="text-gray-500 ml-2 line-clamp-1">{tpl.text.slice(0, 60)}…</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
