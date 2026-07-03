import Link from 'next/link'
import { Megaphone, Plus, ArrowRight } from 'lucide-react'
import { listCampaigns } from '@/lib/db/queries/campaigns'
import { listClients } from '@/lib/db/queries/clients'
import { CAMPAIGN_CHANNELS, CAMPAIGN_STATUS, type Campaign, type CampaignStatus } from '@/types/campaign'
import { BUSINESS_OBJECTIVES } from '@/types/client'
import type { Client } from '@/types/client'
import { EmptyState } from '@/components/ui/EmptyState'
import { MigrateBanner } from '@/components/system/MigrateBanner'

export const dynamic = 'force-dynamic'

const STATUS_FILTERS: Array<{ key: CampaignStatus | 'all'; label: string }> = [
  { key: 'all', label: 'Toutes' },
  { key: 'draft', label: 'Brouillons' },
  { key: 'active', label: 'Actives' },
  { key: 'paused', label: 'En pause' },
  { key: 'completed', label: 'Terminées' },
]

function roasOf(campaign: Campaign): number | null {
  const r = campaign.results
  if (!r || !r.spendEur || r.spendEur <= 0 || !r.revenueEur || r.revenueEur <= 0) return null
  return r.revenueEur / r.spendEur
}

function CampaignCard({ campaign, client }: { campaign: Campaign; client: Client | undefined }) {
  const channelCfg = CAMPAIGN_CHANNELS[campaign.channel]
  const statusCfg = CAMPAIGN_STATUS[campaign.status]
  const roas = roasOf(campaign)
  const spend = campaign.results?.spendEur ?? null
  const leads = campaign.results?.leads ?? null

  return (
    <Link href={`/campaigns/${campaign.id}`} className="block group">
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 transition-all duration-150 hover:border-indigo-700/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.08)]">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl flex-shrink-0">{client?.emoji ?? '📣'}</span>
            <div className="min-w-0">
              <div className="text-sm font-medium text-[#E0E3FF] truncate">{campaign.name}</div>
              <div className="text-xs text-gray-500 truncate mt-0.5">{client?.name ?? campaign.clientId}</div>
            </div>
          </div>
          <span className={`text-[11px] border rounded-full px-2 py-0.5 flex-shrink-0 ${statusCfg.color}`}>{statusCfg.label}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className={`text-[11px] border rounded-md px-2 py-0.5 ${channelCfg.color}`}>{channelCfg.emoji} {channelCfg.label}</span>
          <span className="text-[11px] border border-gray-700 rounded-md px-2 py-0.5 text-gray-400">
            {BUSINESS_OBJECTIVES[campaign.objective]?.label ?? campaign.objective}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-gray-800 pt-3">
          <div className="flex items-center gap-4 text-xs text-gray-400 font-mono">
            <span title="Budget prévu">{campaign.budgetEur.toLocaleString('fr-FR')} €</span>
            {spend !== null && <span title="Dépense réelle">dépensé : {spend.toLocaleString('fr-FR')} €</span>}
            {leads !== null && <span title="Leads générés">{leads} leads</span>}
            {roas !== null && (
              <span className={roas >= 1 ? 'text-emerald-400' : 'text-red-400'} title="Retour sur investissement publicitaire">
                ROAS ×{roas.toFixed(1)}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 text-xs text-indigo-400 group-hover:text-indigo-300 transition-colors duration-150">
            Ouvrir
            <ArrowRight className="w-3 h-3 transition-transform duration-150 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  )
}

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; client?: string }>
}) {
  const { status: statusParam, client: clientParam } = await searchParams
  const statusFilter = STATUS_FILTERS.some(f => f.key === statusParam) && statusParam !== 'all'
    ? (statusParam as CampaignStatus)
    : undefined

  // La table campaigns peut manquer si les migrations n'ont pas encore été
  // appliquées en production (schemaAutoInit désactivé sur Turso).
  let campaigns: Campaign[] = []
  let clients: Client[] = []
  let dbError = false
  try {
    ;[campaigns, clients] = await Promise.all([
      listCampaigns({ status: statusFilter, clientId: clientParam || undefined }),
      listClients(),
    ])
  } catch (err) {
    console.error('[CampaignsPage] DB error:', err)
    dbError = true
  }
  const clientsMap = new Map(clients.map(c => [c.id, c]))

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            📣 Campagnes
            <span className="text-[11px] bg-blue-600/30 text-blue-300 border border-blue-700/40 rounded-full px-2 py-1">META + GOOGLE ADS</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Plans média et annonces générés par IA — achat opéré dans Ads Manager et Google Ads, résultats suivis ici.
          </p>
        </div>
        <Link
          href="/campaigns/new"
          title="Créer une nouvelle campagne publicitaire avec plan média généré par IA"
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 active:scale-[0.98] text-white text-sm font-medium transition-all duration-150 flex items-center gap-2 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nouvelle campagne
        </Link>
      </div>

      {/* Filtres statut */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map(f => {
          const active = (statusParam ?? 'all') === f.key
          return (
            <Link
              key={f.key}
              href={f.key === 'all' ? '/campaigns' : `/campaigns?status=${f.key}`}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-150 ${
                active
                  ? 'bg-purple-900/40 border-purple-500/60 text-purple-200'
                  : 'border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-300'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </div>

      {dbError ? (
        <MigrateBanner context="La page Campagnes ne peut pas encore lire ses données." />
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Aucune campagne pour l'instant"
          description="Créez votre première campagne : l'IA génère le plan média et les annonces prêtes à copier dans la régie."
          cta={{ label: 'Créer une campagne', href: '/campaigns/new' }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {campaigns.map(campaign => (
            <CampaignCard key={campaign.id} campaign={campaign} client={clientsMap.get(campaign.clientId)} />
          ))}
        </div>
      )}
    </div>
  )
}
