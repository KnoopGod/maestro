'use client'
import { useState } from 'react'
import { CheckCircle2, Circle, ExternalLink, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'

const STEPS = [
  {
    id: 'instagram_pro',
    label: 'Compte Instagram est en mode Business ou Créateur',
    detail: 'Un compte personnel ne peut pas être connecté à une Page Facebook ni utiliser l\'API.',
    how: 'Instagram → Paramètres → Compte → Passer en compte professionnel → Business',
    link: 'https://help.instagram.com/502981923235522',
    linkLabel: 'Guide Instagram',
  },
  {
    id: 'instagram_linked',
    label: 'Instagram est lié à la Page Facebook du client',
    detail: 'La liaison se fait côté Facebook (pas Instagram). Sans ça, l\'API ne peut pas poster sur Instagram.',
    how: 'Facebook → ta Page → Paramètres → Instagram → Connecter un compte → entrer les identifiants Instagram',
    link: 'https://www.facebook.com/help/1148909221857370',
    linkLabel: 'Lier depuis Facebook',
  },
  {
    id: 'app_permissions',
    label: 'L\'app Meta a les permissions Instagram activées',
    detail: 'Par défaut, les apps Meta n\'ont pas les permissions Instagram. Il faut les activer dans les Use Cases.',
    how: 'developers.facebook.com → ton app → Use Cases → ajouter "Créer et gérer du contenu Instagram" → activer instagram_basic + instagram_content_publish',
    link: 'https://developers.facebook.com',
    linkLabel: 'Meta Developer Console',
  },
  {
    id: 'page_admin',
    label: 'Tu es Admin (pas Éditeur) de la Page Facebook',
    detail: 'Le rôle Éditeur ne permet pas de publier via l\'API. Seul l\'Admin peut le faire.',
    how: 'Facebook → ta Page → Paramètres → Accès à la Page → vérifier ton rôle',
    link: null,
    linkLabel: null,
  },
]

export function MetaPreflightChecklist({ onReady }: { onReady: () => void }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [openStep, setOpenStep] = useState<string | null>('instagram_pro')
  const [dismissed, setDismissed] = useState(false)

  const allChecked = STEPS.every(s => checked[s.id])

  if (dismissed) return null

  return (
    <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-5 mb-4">
      <div className="flex items-start gap-3 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-300">Prérequis avant connexion</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Vérifie ces 4 points avant de coller ton token. Sinon les permissions Instagram seront manquantes.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {STEPS.map(step => {
          const done = checked[step.id]
          const open = openStep === step.id
          return (
            <div key={step.id} className={`rounded-xl border transition-colors ${done ? 'border-emerald-800/40 bg-emerald-950/20' : 'border-gray-800 bg-gray-950/30'}`}>
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                onClick={() => setOpenStep(open ? null : step.id)}
              >
                <button
                  onClick={e => { e.stopPropagation(); setChecked(c => ({ ...c, [step.id]: !done })) }}
                  className="flex-shrink-0"
                >
                  {done
                    ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                    : <Circle className="w-4.5 h-4.5 text-gray-600 hover:text-gray-400" />
                  }
                </button>
                <span className={`flex-1 text-sm ${done ? 'text-emerald-300' : 'text-gray-200'}`}>
                  {step.label}
                </span>
                {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
              </button>

              {open && (
                <div className="px-10 pb-3 space-y-2">
                  <p className="text-xs text-gray-400">{step.detail}</p>
                  <div className="bg-gray-900/60 rounded-lg px-3 py-2 text-[11px] text-gray-300">
                    <span className="text-gray-500">Comment : </span>{step.how}
                  </div>
                  {step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300"
                    >
                      {step.linkLabel} <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={() => { setDismissed(true); onReady() }}
          disabled={!allChecked}
          className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {allChecked ? 'Tout est prêt — Connecter Meta' : `${Object.values(checked).filter(Boolean).length}/${STEPS.length} points vérifiés`}
        </button>
        <button
          onClick={() => { setDismissed(true); onReady() }}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Ignorer
        </button>
      </div>
    </div>
  )
}
