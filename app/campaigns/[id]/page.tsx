import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Target, Users, Wallet, CalendarRange, MousePointerClick, Lightbulb } from 'lucide-react'
import { getCampaign } from '@/lib/db/queries/campaigns'
import { getClient } from '@/lib/db/queries/clients'
import { CAMPAIGN_CHANNELS, CAMPAIGN_STATUS, META_LIMITS, GOOGLE_LIMITS } from '@/types/campaign'
import { BUSINESS_OBJECTIVES } from '@/types/client'
import { CopyField, CopyList } from '@/components/campaigns/CopyField'
import { CampaignResultsForm } from '@/components/campaigns/CampaignResultsForm'
import { CampaignActions } from '@/components/campaigns/CampaignActions'
import { MigrateBanner } from '@/components/system/MigrateBanner'

export const dynamic = 'force-dynamic'

function formatDate(ts: number | null): string {
  if (!ts) return '—'
  return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // La table campaigns peut manquer si les migrations n'ont pas été appliquées en prod.
  let campaign: Awaited<ReturnType<typeof getCampaign>> = null
  try {
    campaign = await getCampaign(id)
  } catch (err) {
    console.error('[CampaignDetailPage] DB error:', err)
    return (
      <div className="space-y-6 max-w-4xl">
        <Link href="/campaigns" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-150" />
          Retour aux campagnes
        </Link>
        <MigrateBanner context="Cette campagne ne peut pas encore être chargée." />
      </div>
    )
  }
  if (!campaign) notFound()

  const client = await getClient(campaign.clientId)
  const channelCfg = CAMPAIGN_CHANNELS[campaign.channel]
  const statusCfg = CAMPAIGN_STATUS[campaign.status]
  const plan = campaign.mediaPlan

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/campaigns"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-150" />
        Retour aux campagnes
      </Link>

      {/* Header */}
      <div className="pb-5 border-b border-gray-800">
        <div className="flex items-center gap-3 flex-wrap mb-1.5">
          <h1 className="text-3xl font-bold text-[#E0E3FF]">{campaign.name}</h1>
          <span className={`text-[11px] border rounded-full px-2 py-0.5 ${statusCfg.color}`}>{statusCfg.label}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-sm text-gray-400">
          {client && (
            <Link href={`/clients/${client.id}`} className="hover:text-gray-200 transition-colors">
              {client.emoji} {client.name}
            </Link>
          )}
          <span className="text-gray-700">·</span>
          <span className={`text-[11px] border rounded-md px-2 py-0.5 ${channelCfg.color}`}>{channelCfg.emoji} {channelCfg.label}</span>
          <span className="text-gray-700">·</span>
          <span>{BUSINESS_OBJECTIVES[campaign.objective]?.label ?? campaign.objective}</span>
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 font-mono">
          <span className="flex items-center gap-1"><Wallet className="w-3.5 h-3.5" /> {campaign.budgetEur.toLocaleString('fr-FR')} €</span>
          <span className="flex items-center gap-1"><CalendarRange className="w-3.5 h-3.5" /> {formatDate(campaign.startAt)} → {formatDate(campaign.endAt)}</span>
        </div>
      </div>

      <CampaignActions campaign={campaign} />

      {campaign.brief && (
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">Brief de l&apos;agence</div>
          <p className="text-sm text-gray-300">{campaign.brief}</p>
        </div>
      )}

      {/* Plan média */}
      {!plan ? (
        <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-5 text-sm text-amber-200">
          Aucun plan média généré. Utilisez « Régénérer le plan » ci-dessus.
        </div>
      ) : (
        <>
          <section aria-labelledby="plan-heading" className="space-y-3">
            <h2 id="plan-heading" className="text-xl font-bold text-[#E0E3FF]">Plan média</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-indigo-400 mb-1.5">
                  <Users className="w-3.5 h-3.5" /> Audience
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{plan.audience}</p>
              </div>
              <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-indigo-400 mb-1.5">
                  <Wallet className="w-3.5 h-3.5" /> Budget
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{plan.budgetSplit}</p>
              </div>
              <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-indigo-400 mb-1.5">
                  <CalendarRange className="w-3.5 h-3.5" /> Durée et phasage
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{plan.duration}</p>
              </div>
              <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-indigo-400 mb-1.5">
                  <MousePointerClick className="w-3.5 h-3.5" /> Page d&apos;arrivée
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{plan.landingAdvice}</p>
              </div>
            </div>

            {plan.kpisToWatch.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] uppercase tracking-wider text-gray-500 flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" /> KPIs à suivre :
                </span>
                {plan.kpisToWatch.map(kpi => (
                  <span key={kpi} className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-950/30 border border-indigo-800/40 text-indigo-300">
                    {kpi}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Créas Meta */}
          {campaign.channel === 'meta_ads' && plan.metaCreatives && (
            <section aria-labelledby="creatives-heading" className="space-y-3">
              <h2 id="creatives-heading" className="text-xl font-bold text-[#E0E3FF]">
                Annonces — à copier dans Ads Manager
              </h2>
              {plan.metaCreatives.map((creative, i) => (
                <div key={i} className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-gray-800 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-900/60 border border-purple-700/40 flex items-center justify-center text-[11px] text-purple-300 font-bold">{i + 1}</span>
                    <span className="text-sm font-medium text-[#E0E3FF]">Variante {i + 1}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-pink-950/30 border border-pink-800/40 text-pink-300">{creative.angle}</span>
                  </div>
                  <div className="p-5 space-y-3">
                    <CopyField label="Texte principal" value={creative.primaryText} multiline />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <CopyField label="Titre" value={creative.headline} limit={META_LIMITS.headline} />
                      <CopyField label="Description" value={creative.description} limit={META_LIMITS.description} />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <CopyField label="Bouton CTA" value={creative.cta} />
                      <div className="flex items-end">
                        <Link
                          href={`/studio?client=${campaign.clientId}`}
                          title="Ouvrir le Studio pour générer le visuel de cette annonce"
                          className="text-[11px] text-purple-400 hover:text-purple-300 hover:underline transition-colors"
                        >
                          Générer le visuel dans le Studio →
                        </Link>
                      </div>
                    </div>
                    <div className="bg-blue-950/20 border border-blue-800/30 rounded-lg px-3 py-2">
                      <div className="text-[11px] uppercase tracking-wider text-blue-300 mb-0.5 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" /> Brief visuel
                      </div>
                      <p className="text-xs text-gray-300">{creative.visualBrief}</p>
                    </div>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Créas Google */}
          {campaign.channel === 'google_ads' && plan.googleCreative && (
            <section aria-labelledby="creatives-heading" className="space-y-4">
              <h2 id="creatives-heading" className="text-xl font-bold text-[#E0E3FF]">
                Annonce responsive — à copier dans Google Ads
              </h2>
              <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 space-y-4">
                <CopyList label="Titres" items={plan.googleCreative.headlines} limit={GOOGLE_LIMITS.headline} />
                <CopyList label="Descriptions" items={plan.googleCreative.descriptions} limit={GOOGLE_LIMITS.description} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
                  <CopyList label="Mots-clés" items={plan.googleCreative.keywords} />
                </div>
                <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
                  <CopyList label="Mots-clés à exclure" items={plan.googleCreative.negativeKeywords} />
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* Résultats */}
      <CampaignResultsForm campaign={campaign} />

      {/* Coût interne */}
      <p className="text-[11px] text-gray-600 font-mono text-right">
        Coût IA de génération (interne) : ${campaign.cost.toFixed(4)}
      </p>
    </div>
  )
}
