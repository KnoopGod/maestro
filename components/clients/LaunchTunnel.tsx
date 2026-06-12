'use client'
import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2, Circle, ChevronDown, Loader2, BrainCircuit,
  Copy, Check, ExternalLink, Sparkles,
} from 'lucide-react'
import type { LaunchAdvice } from '@/lib/agents/launch-advisor'
import type { LaunchTunnelState } from '@/lib/db/queries/launch-tunnel'

// ─── Définition des 5 étapes du tunnel ────────────────────────────────────────

interface TunnelTask { key: string; label: string }
interface TunnelStep {
  num: number
  title: string
  subtitle: string
  duration: string
  tasks: TunnelTask[]
  adviceKey?: 'step2' | 'step3' | 'step4'
  link?: { href: string; label: string; external?: boolean }
}

function buildSteps(clientId: string): TunnelStep[] {
  return [
    {
      num: 1,
      title: 'Unifier les pages Facebook',
      subtitle: 'Une seule page officielle — l\'algorithme et les clients détestent les doublons',
      duration: '~30 min',
      tasks: [
        { key: '1.identify', label: 'Identifier les pages en doublon (recherche Facebook du nom du client)' },
        { key: '1.merge', label: 'Lancer la fusion sur facebook.com/pages/merge (likes + check-ins transférés)' },
        { key: '1.verify', label: 'Vérifier que la page conservée a bien récupéré l\'historique' },
      ],
      link: { href: 'https://www.facebook.com/pages/merge', label: 'Outil de fusion Meta', external: true },
    },
    {
      num: 2,
      title: 'Configurer la page Facebook',
      subtitle: 'Profil complet = meilleur référencement local + crédibilité immédiate',
      duration: '~1 h',
      adviceKey: 'step2',
      tasks: [
        { key: '2.avatar', label: 'Photo de profil = logo (1024×1024)' },
        { key: '2.cover', label: 'Photo de couverture (1640×924, sans texte incrusté)' },
        { key: '2.cta', label: 'Bouton d\'action configuré (Réserver / Contacter)' },
        { key: '2.about', label: 'Description + adresse + horaires + téléphone + site remplis à 100%' },
        { key: '2.url', label: 'URL personnalisée demandée (facebook.com/nomduclient)' },
      ],
    },
    {
      num: 3,
      title: 'Créer / optimiser Instagram',
      subtitle: 'Compte professionnel, bio qui convertit, grille de 9 posts avant toute promo',
      duration: '~30 min + shooting',
      adviceKey: 'step3',
      tasks: [
        { key: '3.pro', label: 'Compte professionnel créé (catégorie hébergement/restauration)' },
        { key: '3.bio', label: 'Username + bio optimisés (≤150 caractères, lieu, CTA)' },
        { key: '3.linkfb', label: 'Compte lié à la page Facebook (Paramètres → Comptes liés)' },
        { key: '3.grid', label: 'Grille des 9 premiers posts publiée' },
      ],
    },
    {
      num: 4,
      title: 'Connecter à Maestro',
      subtitle: 'Token, permissions, diagnostic — une fois fait, tout se publie en 1 clic',
      duration: '~10 min',
      adviceKey: 'step4',
      tasks: [
        { key: '4.token', label: 'Token généré dans Graph API Explorer (bonnes permissions)' },
        { key: '4.connect', label: 'Page découverte et connectée dans Maestro' },
        { key: '4.diag', label: 'Diagnostic token OK (toutes permissions vertes)' },
      ],
      link: { href: `/clients/${clientId}/connections`, label: 'Ouvrir les connexions' },
    },
    {
      num: 5,
      title: 'Lancer le contenu',
      subtitle: 'Premier post publié + calendrier du mois rempli — le client voit la valeur',
      duration: 'continu',
      tasks: [
        { key: '5.first', label: 'Premier post généré dans Studio et validé' },
        { key: '5.publish', label: 'Publié sur Facebook avec bouton CTA + Instagram' },
        { key: '5.calendar', label: 'Calendrier du mois rempli (8-12 posts planifiés)' },
      ],
      link: { href: `/studio?client=${clientId}`, label: 'Ouvrir le Studio' },
    },
  ]
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function LaunchTunnel({
  clientId, initialState,
}: {
  clientId: string
  initialState: LaunchTunnelState
}) {
  const steps = buildSteps(clientId)
  const [tasksDone, setTasksDone] = useState<string[]>(initialState.tasksDone)
  const [advice, setAdvice] = useState<LaunchAdvice | null>(initialState.advice)
  const [adviceLoading, setAdviceLoading] = useState(false)
  const [adviceError, setAdviceError] = useState<string | null>(null)

  // Étape ouverte par défaut : première étape incomplète
  const firstIncomplete = steps.find(s => !s.tasks.every(t => tasksDone.includes(t.key)))
  const [openStep, setOpenStep] = useState<number | null>(firstIncomplete?.num ?? null)

  const totalTasks = steps.reduce((sum, s) => sum + s.tasks.length, 0)
  const doneCount = tasksDone.filter(k => steps.some(s => s.tasks.some(t => t.key === k))).length
  const pct = Math.round((doneCount / totalTasks) * 100)

  async function toggleTask(taskKey: string) {
    // Optimistic update
    setTasksDone(prev => prev.includes(taskKey) ? prev.filter(k => k !== taskKey) : [...prev, taskKey])
    try {
      const res = await fetch(`/api/clients/${clientId}/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', taskKey }),
      })
      const data = await res.json()
      if (res.ok && Array.isArray(data.tasksDone)) setTasksDone(data.tasksDone)
    } catch { /* l'optimistic update reste */ }
  }

  async function generateAdvice() {
    setAdviceLoading(true)
    setAdviceError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'advice' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur génération conseils')
      setAdvice(data.advice)
    } catch (err) {
      setAdviceError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setAdviceLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Barre de progression globale */}
      <div className="bg-gray-900/40 border border-gray-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] text-indigo-600/60 font-mono tracking-[0.25em] uppercase">// PROGRESSION DU LANCEMENT</span>
          <span className={`text-xs font-bold font-mono ${pct === 100 ? 'text-emerald-400' : 'text-indigo-300'}`}>
            {doneCount}/{totalTasks} — {pct}%
          </span>
        </div>
        <div className="h-1.5 bg-gray-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-600 to-purple-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {pct === 100 && (
          <p className="text-[10px] text-emerald-400/80 font-mono mt-2">✓ Tunnel terminé — ce client est 100% opérationnel</p>
        )}
      </div>

      {/* Bouton conseils IA */}
      {!advice && (
        <button
          onClick={generateAdvice}
          disabled={adviceLoading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-700/40 hover:border-indigo-500/60 text-indigo-300 text-xs font-mono tracking-wider uppercase transition-all disabled:opacity-50"
        >
          {adviceLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Les 3 experts analysent ce client…</>
            : <><BrainCircuit className="w-4 h-4" /> Générer les conseils experts (étapes 2 · 3 · 4)</>}
        </button>
      )}
      {adviceError && (
        <p className="text-[10px] text-red-400 font-mono border border-red-900/40 bg-red-950/20 px-3 py-2">⚠ {adviceError}</p>
      )}
      {advice && (
        <div className="flex items-center justify-between text-[9px] font-mono text-gray-600">
          <span className="text-emerald-500/70">✓ Conseils experts générés — visibles dans les étapes 2, 3 et 4</span>
          <button onClick={generateAdvice} disabled={adviceLoading} className="text-indigo-500 hover:text-indigo-300 tracking-wider uppercase disabled:opacity-50">
            {adviceLoading ? 'Régénération…' : '↻ Régénérer'}
          </button>
        </div>
      )}

      {/* Les 5 étapes */}
      {steps.map(step => {
        const stepDone = step.tasks.every(t => tasksDone.includes(t.key))
        const stepStarted = step.tasks.some(t => tasksDone.includes(t.key))
        const isOpen = openStep === step.num
        const stepAdvice = step.adviceKey && advice ? advice[step.adviceKey] : null

        return (
          <div
            key={step.num}
            className={`border transition-all ${
              stepDone
                ? 'border-emerald-800/40 bg-emerald-950/10'
                : isOpen
                  ? 'border-indigo-700/50 bg-gray-900/60'
                  : 'border-gray-800 bg-gray-900/30'
            }`}
          >
            {/* En-tête d'étape */}
            <button
              onClick={() => setOpenStep(isOpen ? null : step.num)}
              className="w-full flex items-center gap-3 p-4 text-left"
            >
              <div className={`w-8 h-8 flex items-center justify-center flex-shrink-0 border font-mono text-sm font-bold ${
                stepDone
                  ? 'border-emerald-600/50 bg-emerald-950/40 text-emerald-400'
                  : stepStarted
                    ? 'border-amber-600/50 bg-amber-950/30 text-amber-400'
                    : 'border-gray-700 text-gray-500'
              }`}>
                {stepDone ? <Check className="w-4 h-4" /> : step.num}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${stepDone ? 'text-emerald-300/80 line-through' : 'text-white'}`}>
                  {step.title}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">{step.subtitle}</div>
              </div>
              <span className="text-[9px] text-gray-600 font-mono flex-shrink-0">{step.duration}</span>
              <ChevronDown className={`w-4 h-4 text-gray-600 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Contenu d'étape */}
            {isOpen && (
              <div className="px-4 pb-4 space-y-3">
                {/* Checklist */}
                <div className="space-y-1.5">
                  {step.tasks.map(task => {
                    const done = tasksDone.includes(task.key)
                    return (
                      <button
                        key={task.key}
                        onClick={() => toggleTask(task.key)}
                        className={`w-full flex items-start gap-2.5 p-2.5 text-left text-xs border transition-all ${
                          done
                            ? 'border-emerald-900/30 bg-emerald-950/15 text-emerald-300/70'
                            : 'border-gray-800 hover:border-indigo-800/50 text-gray-300'
                        }`}
                      >
                        {done
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-px" />
                          : <Circle className="w-4 h-4 text-gray-600 flex-shrink-0 mt-px" />}
                        <span className={done ? 'line-through' : ''}>{task.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Lien d'action */}
                {step.link && (
                  step.link.external ? (
                    <a href={step.link.href} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] text-indigo-400 hover:text-indigo-300 font-mono tracking-wider uppercase">
                      <ExternalLink className="w-3 h-3" /> {step.link.label}
                    </a>
                  ) : (
                    <Link href={step.link.href}
                      className="inline-flex items-center gap-1.5 text-[10px] text-indigo-400 hover:text-indigo-300 font-mono tracking-wider uppercase">
                      <Sparkles className="w-3 h-3" /> {step.link.label} →
                    </Link>
                  )
                )}

                {/* Conseils experts IA */}
                {step.adviceKey && !advice && !adviceLoading && (
                  <p className="text-[10px] text-gray-600 font-mono italic">
                    💡 Génère les conseils experts ci-dessus pour obtenir des recommandations personnalisées pour ce client.
                  </p>
                )}
                {stepAdvice && <AdvicePanel stepKey={step.adviceKey!} advice={stepAdvice} />}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Panneau de conseils par expert ───────────────────────────────────────────

function AdvicePanel({ stepKey, advice }: {
  stepKey: 'step2' | 'step3' | 'step4'
  advice: LaunchAdvice['step2'] | LaunchAdvice['step3'] | LaunchAdvice['step4']
}) {
  return (
    <div className="border border-indigo-900/40 bg-indigo-950/15 p-3.5 space-y-3">
      <div className="flex items-center gap-2">
        <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
        <span className="text-[9px] text-indigo-400 font-mono tracking-[0.2em] uppercase">
          Expert · {advice.expert}
        </span>
      </div>

      {stepKey === 'step2' && 'pageDescription' in advice && (
        <div className="space-y-2.5 text-xs">
          <CopyField label="Description de page (copier-coller)" value={advice.pageDescription} />
          <CopyField label="Description courte (SEO, ≤155 car.)" value={advice.shortDescription} />
          <InfoRow label="Catégorie" value={advice.categorySuggestion} />
          <InfoRow label="Bouton d'action" value={advice.ctaButton} />
          <InfoRow label="Photo de couverture" value={advice.coverPhotoIdea} />
          <TipsList tips={advice.tips} />
        </div>
      )}

      {stepKey === 'step3' && 'usernameIdeas' in advice && (
        <div className="space-y-2.5 text-xs">
          <div>
            <div className="text-[9px] text-gray-500 font-mono tracking-wider uppercase mb-1">Usernames suggérés</div>
            <div className="flex flex-wrap gap-1.5">
              {advice.usernameIdeas.map((u, i) => (
                <span key={i} className="px-2 py-1 bg-gray-900/60 border border-gray-700 text-indigo-300 font-mono text-[11px]">{u}</span>
              ))}
            </div>
          </div>
          <CopyField label="Bio Instagram (copier-coller)" value={advice.bio} />
          <div>
            <div className="text-[9px] text-gray-500 font-mono tracking-wider uppercase mb-1.5">Grille des 9 premiers posts</div>
            <div className="grid grid-cols-3 gap-1">
              {advice.firstNineGrid.map((post, i) => (
                <div key={i} className="aspect-square bg-gray-900/60 border border-gray-800 p-1.5 flex flex-col">
                  <span className="text-[8px] text-indigo-600 font-mono">{i + 1}</span>
                  <span className="text-[8px] text-gray-400 leading-tight mt-auto">{post}</span>
                </div>
              ))}
            </div>
          </div>
          <TipsList tips={advice.tips} />
        </div>
      )}

      {stepKey === 'step4' && <TipsList tips={advice.tips} />}
    </div>
  )
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] text-gray-500 font-mono tracking-wider uppercase">{label}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
          className="flex items-center gap-1 text-[9px] text-indigo-500 hover:text-indigo-300 font-mono"
        >
          {copied ? <><Check className="w-3 h-3 text-emerald-400" /> Copié</> : <><Copy className="w-3 h-3" /> Copier</>}
        </button>
      </div>
      <p className="bg-gray-950/60 border border-gray-800 p-2.5 text-gray-300 text-[11px] leading-relaxed whitespace-pre-wrap">{value}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-[9px] text-gray-500 font-mono tracking-wider uppercase">{label} : </span>
      <span className="text-gray-300 text-[11px]">{value}</span>
    </div>
  )
}

function TipsList({ tips }: { tips: string[] }) {
  return (
    <ul className="space-y-1">
      {tips.map((tip, i) => (
        <li key={i} className="flex items-start gap-2 text-[11px] text-gray-400 leading-relaxed">
          <span className="text-indigo-500 flex-shrink-0 mt-px">▸</span>
          {tip}
        </li>
      ))}
    </ul>
  )
}
