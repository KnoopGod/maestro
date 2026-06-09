'use client'
import { useState } from 'react'
import { CheckCircle2, Circle, ExternalLink, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'

const STEPS = [
  {
    id: 'instagram_pro',
    label: 'Instagram professionnel',
    detail: 'Passe le compte Instagram du client en Business ou Créateur. Un compte personnel ne peut pas publier via l\'API.',
    how: 'Instagram → Paramètres → Compte → Passer en compte professionnel → Business',
    link: 'https://help.instagram.com/502981923235522',
    linkLabel: 'Guide Instagram',
  },
  {
    id: 'instagram_linked',
    label: 'Instagram lié à la Page Facebook',
    detail: 'Lie l\'Instagram professionnel à la Page Facebook exacte du client. Le wizard ne voit Instagram que via cette liaison.',
    how: 'Facebook → ta Page → Paramètres → Instagram → Connecter un compte → entrer les identifiants Instagram',
    link: 'https://www.facebook.com/help/1148909221857370',
    linkLabel: 'Lier depuis Facebook',
  },
  {
    id: 'app_permissions',
    label: 'Permissions Meta activées',
    detail: 'Dans l\'app Meta globale, active les cas d\'usage Pages + Instagram avant de générer un token.',
    how: 'Scopes requis : pages_show_list, pages_read_engagement, pages_manage_posts, instagram_basic, instagram_content_publish',
    link: 'https://developers.facebook.com',
    linkLabel: 'Meta Developer Console',
  },
  {
    id: 'user_token',
    label: 'User Access Token généré',
    detail: 'Génère un User Access Token dans Graph API Explorer avec les scopes requis. CODEXRS l\'utilise seulement pour découvrir les Pages.',
    how: 'Graph API Explorer → choisir ton app → Add permissions → Generate Access Token → accepter les Pages du client',
    link: 'https://developers.facebook.com/tools/explorer',
    linkLabel: 'Graph API Explorer',
  },
  {
    id: 'diagnostic_test',
    label: 'Diagnostic et test publiés',
    detail: 'Après connexion, lance le diagnostic du Page Access Token stocké puis publie un test Facebook réel à supprimer.',
    how: 'Dans ce panneau : Diagnostiquer le token → corriger les scopes manquants → Test post réel',
    link: null,
    linkLabel: null,
  },
]

export function MetaPreflightChecklist() {
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
          <p className="text-sm font-semibold text-amber-300">Guide Meta pour ce client</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Vérifie ces 5 points dans l&apos;ordre pour brancher Facebook et Instagram sans deviner.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {STEPS.map(step => {
          const done = checked[step.id]
          const open = openStep === step.id
          return (
            <div key={step.id} className={`rounded-xl border transition-colors ${done ? 'border-emerald-800/40 bg-emerald-950/20' : 'border-gray-800 bg-gray-950/30'}`}>
              <div className="w-full flex items-center gap-3 px-3 py-2.5 text-left">
                <button
                  type="button"
                  onClick={() => setChecked(c => ({ ...c, [step.id]: !done }))}
                  className="flex-shrink-0"
                  aria-label={done ? `Marquer ${step.label} comme non vérifié` : `Marquer ${step.label} comme vérifié`}
                >
                  {done
                    ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                    : <Circle className="w-4.5 h-4.5 text-gray-600 hover:text-gray-400" />
                  }
                </button>
                <span className={`flex-1 text-sm ${done ? 'text-emerald-300' : 'text-gray-200'}`}>
                  {step.label}
                </span>
                <button
                  type="button"
                  onClick={() => setOpenStep(open ? null : step.id)}
                  className="rounded p-1 text-gray-500 hover:text-gray-300"
                  aria-label={open ? `Replier ${step.label}` : `Déplier ${step.label}`}
                >
                  {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

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
          onClick={() => setDismissed(true)}
          disabled={!allChecked}
          className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {allChecked ? 'Guide vérifié — Connecter Meta' : `${Object.values(checked).filter(Boolean).length}/${STEPS.length} étapes vérifiées`}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Ignorer
        </button>
      </div>
    </div>
  )
}
