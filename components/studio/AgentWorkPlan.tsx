import type { Client } from '@/types/client'
import type { ClientAsset } from '@/types/asset'
import type { Platform, ContentType, GenerationResult } from '@/lib/studio/types'
import { PLATFORM_INFO, CONTENT_TYPE_INFO } from '@/lib/studio/types'

export function AgentWorkPlan({
  selectedClient,
  brief,
  visualPrompt,
  platforms,
  contentType,
  imageMode,
  selectedAsset,
  result,
}: {
  selectedClient?: Client
  brief: string
  visualPrompt: string
  platforms: Platform[]
  contentType: ContentType
  imageMode: 'generate' | 'library'
  selectedAsset: ClientAsset | null
  result: GenerationResult | null
}) {
  const clientLabel = selectedClient
    ? `${selectedClient.name}${selectedClient.city ? ` · ${selectedClient.city}` : ''}`
    : 'Client non sélectionné'
  const platformLabel = platforms.length
    ? platforms.map(p => PLATFORM_INFO[p].label).join(' + ')
    : 'Aucune plateforme'
  const visualTask = imageMode === 'library'
    ? selectedAsset ? `Utiliser la ressource Library : ${selectedAsset.originalName}` : 'Attendre une ressource Library'
    : visualPrompt.trim()
      ? `Créer un visuel avec cette direction : ${visualPrompt.trim()}`
      : 'Créer un visuel cohérent avec la DA et le brief'

  const steps = [
    {
      agent: 'Account Director',
      before: `Identifier ${clientLabel}, relire stratégie, historique et résumé client.`,
      after: result?.directive ? `${result.directive.priorityPillar} — ${result.directive.rationale}` : null,
    },
    {
      agent: 'Social Director',
      before: `Transformer l'ordre en texte ${platformLabel}. Brief : ${brief.trim() || 'à compléter'}`,
      after: result?.captions?.length ? `${result.captions.length} caption(s), hook principal : ${result.captions[0]?.hook || '—'}` : null,
    },
    {
      agent: 'Visual Director',
      before: `${visualTask}. Format demandé : ${CONTENT_TYPE_INFO[contentType].label}.`,
      after: result?.post.imageUrl
        ? 'Visuel prêt et attaché au draft.'
        : result?.imageError
          ? `Échec visuel : ${result.imageError}`
          : null,
    },
    {
      agent: 'Impact Reviewer',
      before: 'Contrôler hook, CTA, cohérence DA, score impact et risques avant validation.',
      after: result ? `Score ${result.post.impactScore}/100${result.review ? ` · verdict ${result.review.verdict}` : ''}` : null,
    },
    {
      agent: 'Publisher',
      before: 'Laisser en validation avant publication automatique Facebook/Instagram.',
      after: result ? `Draft ${result.post.status} créé : #${result.post.id}` : null,
    },
  ]

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-white">🧠 Préparation des agents</h3>
        <p className="text-xs text-gray-500 mt-1">
          Ce panneau montre ce que chaque agent s&apos;apprête à faire, puis son résultat après génération.
        </p>
      </div>
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={step.agent} className="rounded-xl border border-gray-800 bg-gray-950/40 p-3">
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <div className="text-xs font-semibold text-purple-200">
                {index + 1}. {step.agent}
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                step.after
                  ? step.after.startsWith('Échec')
                    ? 'border-amber-700/50 text-amber-300 bg-amber-950/20'
                    : 'border-emerald-700/50 text-emerald-300 bg-emerald-950/20'
                  : 'border-gray-700 text-gray-500 bg-gray-900/50'
              }`}>
                {step.after ? 'Résultat' : 'Prévu'}
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">{step.after || step.before}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
