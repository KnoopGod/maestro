import React from 'react'
import Link from 'next/link'
import { TrendingUp, Target, AlertCircle, Users, Sparkles, CheckCircle2, BarChart2 } from 'lucide-react'
import { listClients } from '@/lib/db/queries/clients'
import { listPosts } from '@/lib/db/queries/posts'
import { BUSINESS_OBJECTIVES, BUSINESS_TARGET_DELAYS } from '@/types/client'
import type { BusinessObjective, BusinessTargetDelay, Client } from '@/types/client'

export const dynamic = 'force-dynamic'

function getMonthStart(): number {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

const OBJECTIVE_COLOR: Record<BusinessObjective, string> = {
  fill_slow_days:               'text-amber-400  bg-amber-950/30  border-amber-800/30',
  increase_calls:               'text-blue-400   bg-blue-950/30   border-blue-800/30',
  increase_bookings:            'text-emerald-400 bg-emerald-950/30 border-emerald-800/30',
  sell_offer:                   'text-orange-400 bg-orange-950/30 border-orange-800/30',
  sell_membership:              'text-purple-400 bg-purple-950/30 border-purple-800/30',
  promote_event:                'text-pink-400   bg-pink-950/30   border-pink-800/30',
  get_google_reviews:           'text-yellow-400 bg-yellow-950/30 border-yellow-800/30',
  increase_dms:                 'text-cyan-400   bg-cyan-950/30   border-cyan-800/30',
  reduce_platform_dependency:   'text-red-400    bg-red-950/30    border-red-800/30',
  improve_google_maps_visibility:'text-green-400  bg-green-950/30  border-green-800/30',
  increase_revenue_period:      'text-indigo-400 bg-indigo-950/30 border-indigo-800/30',
  attract_new_customers:        'text-fuchsia-400 bg-fuchsia-950/30 border-fuchsia-800/30',
}

export default async function GrowthPage() {
  const monthStart = getMonthStart()

  const [clients, posts] = await Promise.all([
    listClients(),
    listPosts({ statuses: ['published', 'draft', 'ready', 'scheduled'], limit: 2000, includeInsights: true }),
  ])

  const activeClients = clients.filter(c => c.status === 'active')

  const clientData = activeClients.map(client => {
    const clientPosts = posts.filter(p => p.clientId === client.id)
    const publishedPosts = clientPosts.filter(p => p.status === 'published')
    const thisMonthPosts = clientPosts.filter(p => p.createdAt >= monthStart)
    const publishedThisMonth = publishedPosts.filter(
      p => p.publishedAt != null && p.publishedAt >= monthStart
    )

    const avgImpact = publishedPosts.length > 0
      ? Math.round(publishedPosts.reduce((s, p) => s + p.impactScore, 0) / publishedPosts.length)
      : null

    const costThisMonth = thisMonthPosts.reduce((s, p) => s + p.cost, 0)

    const totalEngagement = publishedPosts.reduce(
      (s, p) => s + p.metaInsights.reduce((si, ins) => si + ins.likes + ins.comments + ins.shares, 0),
      0
    )

    return {
      client,
      hasProfile: !!client.businessProfile,
      objective: client.businessProfile?.priorityObjective ?? null,
      targetDelay: client.businessProfile?.targetDelay ?? null,
      totalPublished: publishedPosts.length,
      publishedThisMonth: publishedThisMonth.length,
      totalPostsThisMonth: thisMonthPosts.length,
      avgImpact,
      costThisMonth,
      totalEngagement,
    }
  })

  const withProfile = clientData.filter(d => d.hasProfile)
  const withoutProfile = clientData.filter(d => !d.hasProfile)

  // Objective distribution across all clients with profiles
  const objectiveMap = new Map<BusinessObjective, number>()
  for (const d of withProfile) {
    if (d.objective) {
      objectiveMap.set(d.objective, (objectiveMap.get(d.objective) ?? 0) + 1)
    }
  }
  const objectiveDistrib = Array.from(objectiveMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([obj, count]) => ({ obj, count }))

  const totalPublishedAllClients = clientData.reduce((s, d) => s + d.totalPublished, 0)
  const totalCostThisMonth = clientData.reduce((s, d) => s + d.costThisMonth, 0)
  const totalEngagementAll = clientData.reduce((s, d) => s + d.totalEngagement, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-emerald-400" />
            Croissance
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Suivi des objectifs business · {withProfile.length}/{activeClients.length} clients configurés
          </p>
        </div>
        <Link
          href="/clients"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5"
        >
          <Users className="w-4 h-4" />
          Gérer les clients
        </Link>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Clients avec objectif"
          value={`${withProfile.length}/${activeClients.length}`}
          icon={Target}
          color="text-indigo-400"
          grad="from-indigo-950/40"
          border="border-indigo-800/30"
        />
        <StatCard
          label="Posts publiés (total)"
          value={totalPublishedAllClients}
          icon={CheckCircle2}
          color="text-emerald-400"
          grad="from-emerald-950/40"
          border="border-emerald-800/30"
        />
        <StatCard
          label="Engagement cumulé"
          value={totalEngagementAll > 0 ? totalEngagementAll.toLocaleString() : '—'}
          icon={BarChart2}
          color="text-purple-400"
          grad="from-purple-950/40"
          border="border-purple-800/30"
        />
        <StatCard
          label="Coût IA ce mois"
          value={totalCostThisMonth > 0 ? `$${totalCostThisMonth.toFixed(3)}` : '$0'}
          icon={Sparkles}
          color="text-amber-400"
          grad="from-amber-950/40"
          border="border-amber-800/30"
        />
      </div>

      {/* Missing profiles alert */}
      {withoutProfile.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-800/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-300">
              {withoutProfile.length} client{withoutProfile.length > 1 ? 's' : ''} sans profil business
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Sans objectif défini, le Studio ne peut pas orienter les contenus vers des résultats mesurables.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {withoutProfile.map(d => (
                <Link
                  key={d.client.id}
                  href={`/clients/${d.client.id}/business`}
                  className="inline-flex items-center gap-1.5 text-xs px-2 py-1 bg-amber-950/40 text-amber-400 border border-amber-800/30 rounded-lg hover:bg-amber-900/30 transition-colors"
                >
                  {d.client.emoji} {d.client.name} →
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Per-client growth cards */}
      {clientData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {clientData.map(d => (
            <ClientGrowthCard key={d.client.id} data={d} />
          ))}
        </div>
      ) : (
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-12 text-center">
          <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Aucun client actif.</p>
          <Link href="/clients/new" className="text-indigo-400 hover:underline text-sm mt-2 inline-block">
            Créer le premier client →
          </Link>
        </div>
      )}

      {/* Objective distribution */}
      {objectiveDistrib.length > 0 && (
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Répartition des objectifs business</h2>
          <div className="space-y-2.5">
            {objectiveDistrib.map(({ obj, count }) => {
              const objDef = BUSINESS_OBJECTIVES[obj]
              const pct = Math.round((count / withProfile.length) * 100)
              return (
                <div key={obj} className="flex items-center gap-3">
                  <div className={`text-xs px-2 py-0.5 rounded-md border font-medium flex-shrink-0 w-52 truncate ${OBJECTIVE_COLOR[obj]}`}>
                    {objDef?.label ?? obj}
                  </div>
                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white w-6 text-right flex-shrink-0">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

interface ClientDataItem {
  client: Client
  hasProfile: boolean
  objective: BusinessObjective | null
  targetDelay: BusinessTargetDelay | null
  totalPublished: number
  publishedThisMonth: number
  totalPostsThisMonth: number
  avgImpact: number | null
  costThisMonth: number
  totalEngagement: number
}

function ClientGrowthCard({ data }: { data: ClientDataItem }) {
  const { client, hasProfile, objective, targetDelay, totalPublished, publishedThisMonth, avgImpact, costThisMonth, totalEngagement } = data
  const objDef = objective ? BUSINESS_OBJECTIVES[objective] : null
  const delayLabel = targetDelay ? (BUSINESS_TARGET_DELAYS[targetDelay as keyof typeof BUSINESS_TARGET_DELAYS]?.label ?? targetDelay) : null

  return (
    <Link
      href={`/clients/${client.id}`}
      className="block bg-gray-900/40 border border-gray-800 rounded-2xl p-5 hover:border-indigo-800/50 hover:bg-gray-800/30 transition-all group"
    >
      {/* Client header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${client.color} flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-105 transition-transform`}>
          {client.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{client.name}</div>
          {hasProfile && objDef ? (
            <span className={`inline-block text-[10px] px-2 py-0.5 mt-0.5 rounded border font-medium ${OBJECTIVE_COLOR[objective!]}`}>
              {objDef.label}
              {delayLabel && <span className="opacity-60 ml-1">· {delayLabel}</span>}
            </span>
          ) : (
            <Link
              href={`/clients/${client.id}/business`}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="inline-block text-[10px] px-2 py-0.5 mt-0.5 rounded border border-amber-800/30 bg-amber-950/20 text-amber-500 hover:text-amber-300 transition-colors"
            >
              Configurer le profil →
            </Link>
          )}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-3">
        <Metric
          label="Publiés ce mois"
          value={publishedThisMonth}
          sub={`${totalPublished} au total`}
          accent={publishedThisMonth > 0 ? 'text-emerald-400' : 'text-gray-500'}
        />
        <Metric
          label="Score impact moyen"
          value={avgImpact != null ? `${avgImpact}/100` : '—'}
          sub={`${totalPublished} post${totalPublished !== 1 ? 's' : ''} analysés`}
          accent={
            avgImpact == null ? 'text-gray-500'
              : avgImpact >= 70 ? 'text-emerald-400'
              : avgImpact >= 50 ? 'text-amber-400'
              : 'text-red-400'
          }
        />
        <Metric
          label="Engagement total"
          value={totalEngagement > 0 ? totalEngagement.toLocaleString() : '—'}
          sub="likes + com. + partages"
          accent={totalEngagement > 0 ? 'text-purple-400' : 'text-gray-500'}
        />
        <Metric
          label="Coût IA ce mois"
          value={costThisMonth > 0 ? `$${costThisMonth.toFixed(3)}` : '$0'}
          sub="coût générations"
          accent="text-amber-400"
        />
      </div>
    </Link>
  )
}

function Metric({ label, value, sub, accent }: {
  label: string
  value: string | number
  sub: string
  accent: string
}) {
  return (
    <div className="bg-gray-800/30 rounded-xl p-3">
      <div className="text-[10px] text-gray-500 mb-1">{label}</div>
      <div className={`text-lg font-bold font-mono ${accent}`}>{value}</div>
      <div className="text-[10px] text-gray-600 mt-0.5">{sub}</div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color, grad, border }: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  grad: string
  border: string
}) {
  return (
    <div className={`bg-gradient-to-br ${grad} to-gray-900/40 border ${border} rounded-xl p-5`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
    </div>
  )
}
