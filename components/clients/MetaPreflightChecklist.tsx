'use client'
import { useState } from 'react'
import { CheckCircle2, Circle, ChevronDown, ChevronUp, ExternalLink, AlertTriangle, CheckCheck } from 'lucide-react'

interface Step {
  id: string
  label: string
  detail: string
  instruction: string
  link?: { url: string; label: string }
  warning?: string
}

interface Phase {
  id: string
  title: string
  badge: string
  badgeColor: string
  steps: Step[]
}

const PHASES: Phase[] = [
  {
    id: 'prereqs',
    title: 'Prérequis client',
    badge: 'Une seule fois par client',
    badgeColor: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
    steps: [
      {
        id: 'ig_pro',
        label: 'Instagram est en mode Professionnel (Business)',
        detail: 'Un compte Instagram personnel ne peut pas être connecté via l\'API Meta. Il doit être en mode Business ou Créateur.',
        instruction: 'Instagram → Profil → ☰ → Paramètres → Compte → tout en bas → "Passer en compte professionnel" → choisir Business.',
        link: { url: 'https://help.instagram.com/502981923235522', label: 'Guide Instagram officiel' },
      },
      {
        id: 'ig_linked',
        label: 'Instagram est lié à la Page Facebook du client',
        detail: 'La liaison se fait depuis Facebook, pas depuis Instagram. Sans ça, l\'API ne trouve pas le compte Instagram.',
        instruction: 'Page Facebook → Paramètres → Instagram (menu gauche) → "Connecter un compte" → entrer les identifiants Instagram du client.',
        link: { url: 'https://www.facebook.com/help/1148909221857370', label: 'Guide Facebook officiel' },
        warning: 'Vérifie que les 2 logos (FB + IG) apparaissent ensemble dans Meta Business Suite — c\'est la confirmation visuelle.',
      },
      {
        id: 'page_admin',
        label: 'Ton compte Facebook est Admin de la Page (pas Éditeur)',
        detail: 'Le rôle Éditeur ne permet pas de publier via l\'API. Seul l\'Admin peut autoriser les publications programmatiques.',
        instruction: 'Page Facebook → Paramètres → Accès à la Page → Personnes → vérifie que ton compte a le rôle "Admin".',
      },
    ],
  },
  {
    id: 'app',
    title: 'App Meta Developer',
    badge: 'Une seule fois pour Maestro',
    badgeColor: 'bg-purple-900/40 text-purple-300 border-purple-700/40',
    steps: [
      {
        id: 'app_created',
        label: 'L\'app "Maestro" existe sur developers.facebook.com',
        detail: 'Il faut une app Meta Developer pour générer des tokens d\'accès. Tu n\'en as besoin que d\'une seule pour tous tes clients.',
        instruction: 'developers.facebook.com/apps → "Créer une app" → Type : "Autre" → "Business" → Nom : Maestro → Business Account : ton Business Manager → Créer.',
        link: { url: 'https://developers.facebook.com/apps', label: 'Ouvrir Meta for Developers' },
      },
      {
        id: 'ig_usecase',
        label: 'Le Use Case Instagram est activé dans l\'app',
        detail: 'Par défaut, une nouvelle app n\'a pas les permissions Instagram. Il faut les activer dans les Use Cases.',
        instruction: 'Dans ton app → "Use cases" → "Créer et gérer du contenu Instagram" → Personnaliser → activer instagram_basic + instagram_content_publish → Sauvegarder.',
        warning: 'Si cette étape est manquée, le token généré n\'aura jamais les permissions Instagram même si tu les coches dans l\'Explorer.',
      },
      {
        id: 'app_keys',
        label: 'App ID et App Secret sont configurés dans Maestro',
        detail: 'Sans ces clés, les tokens expirent après 1-2h. Avec elles, Maestro échange automatiquement pour un token de 60 jours.',
        instruction: 'App → Paramètres → Paramètres de base → copie App ID et App Secret → dans Maestro : Settings → colle les valeurs META_APP_ID et META_APP_SECRET (ou dans Vercel → Environment Variables).',
        link: { url: 'https://developers.facebook.com/apps', label: 'Ouvrir mon app' },
      },
    ],
  },
  {
    id: 'token',
    title: 'Token d\'accès',
    badge: 'À renouveler par client',
    badgeColor: 'bg-amber-900/40 text-amber-300 border-amber-700/40',
    steps: [
      {
        id: 'token_generated',
        label: 'User Access Token généré dans Graph API Explorer',
        detail: 'Le token est la clé d\'autorisation que tu colles dans Maestro. Il doit être généré avec les bonnes permissions.',
        instruction: 'developers.facebook.com/tools/explorer → sélectionne ton app "Maestro" → User Token → "Add a Permission" → coche : pages_show_list, pages_read_engagement, pages_manage_posts, instagram_basic, instagram_content_publish → "Generate Access Token" → Copier.',
        link: { url: 'https://developers.facebook.com/tools/explorer', label: 'Ouvrir Graph API Explorer' },
        warning: 'Vérifie que l\'app sélectionnée en haut à droite est bien "Maestro" et pas une autre app.',
      },
    ],
  },
]

export function MetaPreflightChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [openStep, setOpenStep] = useState<string | null>('ig_pro')
  const [openPhase, setOpenPhase] = useState<string | null>('prereqs')
  const [dismissed, setDismissed] = useState(false)

  const allSteps = PHASES.flatMap(p => p.steps)
  const totalSteps = allSteps.length
  const doneCount = allSteps.filter(s => checked[s.id]).length
  const allDone = doneCount === totalSteps

  const toggle = (id: string) => setChecked(c => ({ ...c, [id]: !c[id] }))

  if (dismissed) return null

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-white">Guide de connexion Meta</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Coche chaque étape avant de coller ton token ci-dessous.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs font-mono text-gray-400">{doneCount}/{totalSteps}</span>
          {allDone && (
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <CheckCheck className="w-3.5 h-3.5" /> Prêt
            </span>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            Masquer
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-800 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-600 to-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${(doneCount / totalSteps) * 100}%` }}
        />
      </div>

      {/* Phases */}
      <div className="space-y-3">
        {PHASES.map(phase => {
          const phaseDone = phase.steps.every(s => checked[s.id])
          const phaseOpen = openPhase === phase.id
          return (
            <div key={phase.id} className={`border rounded-xl transition-colors ${phaseDone ? 'border-emerald-800/40' : 'border-gray-800'}`}>
              {/* Phase header */}
              <button
                type="button"
                onClick={() => setOpenPhase(phaseOpen ? null : phase.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                {phaseDone
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  : <Circle className="w-4 h-4 text-gray-600 flex-shrink-0" />
                }
                <span className={`flex-1 text-sm font-medium ${phaseDone ? 'text-emerald-300' : 'text-gray-200'}`}>
                  {phase.title}
                </span>
                <span className={`text-[10px] font-mono border rounded-full px-2 py-0.5 ${phase.badgeColor}`}>
                  {phase.badge}
                </span>
                {phaseOpen
                  ? <ChevronUp className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  : <ChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                }
              </button>

              {/* Steps */}
              {phaseOpen && (
                <div className="px-4 pb-4 space-y-2 border-t border-gray-800/60">
                  {phase.steps.map(step => {
                    const done = checked[step.id]
                    const open = openStep === step.id
                    return (
                      <div key={step.id} className={`rounded-lg border mt-2 transition-colors ${done ? 'border-emerald-800/30 bg-emerald-950/10' : 'border-gray-800 bg-gray-950/20'}`}>
                        <div className="flex items-center gap-3 px-3 py-2.5">
                          <button
                            type="button"
                            onClick={() => toggle(step.id)}
                            className="flex-shrink-0"
                            aria-label={done ? `Décocher ${step.label}` : `Cocher ${step.label}`}
                          >
                            {done
                              ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              : <Circle className="w-4 h-4 text-gray-600 hover:text-gray-400 transition-colors" />
                            }
                          </button>
                          <span className={`flex-1 text-xs font-medium ${done ? 'text-emerald-300 line-through decoration-emerald-700' : 'text-gray-200'}`}>
                            {step.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => setOpenStep(open ? null : step.id)}
                            className="p-1 text-gray-600 hover:text-gray-400 transition-colors"
                          >
                            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>

                        {open && (
                          <div className="px-10 pb-3 space-y-2">
                            <p className="text-xs text-gray-400 leading-relaxed">{step.detail}</p>
                            <div className="bg-gray-900/80 border border-gray-700/50 rounded-lg px-3 py-2">
                              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-1">Comment faire</p>
                              <p className="text-xs text-gray-300 leading-relaxed">{step.instruction}</p>
                            </div>
                            {step.warning && (
                              <div className="flex items-start gap-2 bg-amber-950/20 border border-amber-800/30 rounded-lg px-3 py-2">
                                <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                                <p className="text-[11px] text-amber-300 leading-relaxed">{step.warning}</p>
                              </div>
                            )}
                            {step.link && (
                              <a
                                href={step.link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[11px] text-purple-400 hover:text-purple-300 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                {step.link.label}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Errors reference */}
      <details className="mt-4">
        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400 transition-colors select-none">
          Erreurs fréquentes →
        </summary>
        <div className="mt-2 space-y-1.5">
          {[
            { err: 'Aucune page trouvée', cause: 'pages_show_list manquant dans le token', fix: 'Régénère le token en cochant toutes les permissions' },
            { err: 'Aucun compte Instagram professionnel', cause: 'IG non lié à la Page FB', fix: 'Phase 0 → étape B — lier depuis Facebook' },
            { err: '#200 Permissions error', cause: 'Rôle Éditeur au lieu d\'Admin sur la Page', fix: 'Phase 0 → étape C — passer en Admin' },
            { err: 'Token expiré après 1-2h', cause: 'META_APP_ID / META_APP_SECRET manquants', fix: 'Phase 1 → étape 3 — configurer les clés' },
            { err: 'Token invalide', cause: 'Mauvaise app sélectionnée dans l\'Explorer', fix: 'Vérifie que "Maestro" est sélectionné en haut à droite dans l\'Explorer' },
          ].map(({ err, cause, fix }) => (
            <div key={err} className="bg-gray-900/60 border border-gray-800 rounded-lg px-3 py-2 text-[10px]">
              <span className="text-red-400 font-mono">{err}</span>
              <span className="text-gray-600 mx-1.5">→</span>
              <span className="text-gray-400">{cause}</span>
              <span className="text-gray-600 mx-1.5">·</span>
              <span className="text-emerald-400">{fix}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  )
}
