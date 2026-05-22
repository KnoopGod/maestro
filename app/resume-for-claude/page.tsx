'use client'
import { useState } from 'react'
import { WORK_SESSIONS } from '@/lib/mock-data/work-memory'
import { WorkSession } from '@/types'
import { Copy, Check, FileText, Zap } from 'lucide-react'

const AI_LABEL: Record<string, string> = {
  claude: 'Claude', chatgpt: 'ChatGPT', ollama: 'Ollama Local',
}

function buildResume(session: WorkSession): string {
  const stepsText = session.steps
    .filter(s => s.status === 'completed')
    .map((s, i) =>
      `  ${i + 1}. [${AI_LABEL[s.ai] ?? s.ai}] ${s.action}\n` +
      `     → Prompt : ${s.promptSummary}\n` +
      `     → Résultat : ${s.outputSummary}\n` +
      `     → Tokens : ${s.tokensUsed.toLocaleString()}`
    ).join('\n\n')

  const aiUsed = [...new Set(session.steps.map(s => AI_LABEL[s.ai] ?? s.ai))].join(', ')

  return `# RÉSUMÉ DE REPRISE — Pour Claude
Date : ${session.date}
Projet : ${session.project}

## MISSION INITIALE
${session.mission}

## IAs UTILISÉES
${aiUsed}

## TRAVAIL EFFECTUÉ
${stepsText}

## RÉSUMÉ
${session.summary}

## DÉCISIONS PRISES
- Routage automatique selon mode Hybride
- Ollama utilisé pour les tâches légères (économie : $${session.savings.toFixed(2)})
- Claude réservé pour la stratégie et la validation

## POINTS À VÉRIFIER
- Cohérence globale du livrable
- Validation qualité sur les outputs Ollama
- Alignement avec la brief initiale

## PROCHAINE ACTION DEMANDÉE
${session.nextAction}

## CONTEXTE TOKENS
Tokens utilisés jusqu'ici : ~${session.tokensUsed.toLocaleString()}
Coût session : $${session.estimatedCost.toFixed(2)}
Économies réalisées : $${session.savings.toFixed(2)}

---
Généré par AI Command Center — ${new Date().toLocaleDateString('fr-FR')}`
}

export default function ResumeForClaudePage() {
  const [selectedId, setSelectedId] = useState<string>(WORK_SESSIONS[0].id)
  const [copied, setCopied] = useState(false)

  const session = WORK_SESSIONS.find(s => s.id === selectedId)!
  const resume = buildResume(session)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(resume)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Resume for Claude</h1>
        <p className="text-sm text-gray-500 mt-0.5">Génère un résumé structuré pour que Claude reprenne un travail</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left — session selector */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" />
            Sélectionne une session
          </h3>
          <div className="space-y-2">
            {WORK_SESSIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all
                  ${selectedId === s.id
                    ? 'bg-purple-900/30 border-purple-600/40'
                    : 'bg-gray-900/50 border-gray-800 hover:border-gray-700'
                  }`}
              >
                <div className="font-medium text-sm text-gray-200 mb-1">{s.mission}</div>
                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                  <span>{s.project}</span>
                  <span>·</span>
                  <span>{s.date}</span>
                  <span>·</span>
                  <span className={s.status === 'active' ? 'text-blue-400' : s.status === 'paused' ? 'text-orange-400' : 'text-green-400'}>
                    {s.status === 'active' ? 'En cours' : s.status === 'paused' ? 'En pause' : 'Terminée'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {[...new Set(s.aiSequence)].map((ai) => (
                    <span key={ai} className={`text-[10px] font-semibold ${ai === 'claude' ? 'text-purple-400' : ai === 'chatgpt' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {AI_LABEL[ai]}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right — resume output */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              Résumé généré
            </h3>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 text-xs px-4 py-2 rounded-lg font-medium transition-all
                ${copied
                  ? 'bg-green-600 text-white'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copié !' : 'Copier le résumé'}
            </button>
          </div>

          <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-4 font-mono text-xs text-gray-300 leading-relaxed overflow-y-auto max-h-[600px] whitespace-pre-wrap">
            {resume}
          </div>

          <div className="bg-purple-900/20 border border-purple-800/30 rounded-lg p-3 text-xs text-purple-300">
            <strong>Comment l'utiliser :</strong> Copie ce résumé et colle-le en début de conversation avec Claude. Il aura tout le contexte pour reprendre le travail exactement là où tu t'es arrêté.
          </div>
        </div>
      </div>
    </div>
  )
}
