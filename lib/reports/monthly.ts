import { getClient } from '@/lib/db/queries/clients'
import { listPosts } from '@/lib/db/queries/posts'
import { listCampaigns } from '@/lib/db/queries/campaigns'
import { getPlaybookForClient } from '@/lib/playbooks'
import { BUSINESS_OBJECTIVES, type BusinessObjective, type Client } from '@/types/client'
import type { Post } from '@/types/post'
import type { CampaignChannel } from '@/types/campaign'

/**
 * Calculs du rapport mensuel client — module pur, sans JSX ni appel IA.
 * Ne JAMAIS exposer cost/tokensUsed ici : données internes agence.
 */

export interface MonthlyReportTotals {
  postsPublished: number
  reach: number
  impressions: number
  interactions: number
  /** interactions / reach en %, 1 décimale — null si reach = 0 (jamais inventé). */
  engagementRate: number | null
}

export interface MonthlyReportCampaign {
  id: string
  name: string
  channel: CampaignChannel
  spendEur: number | null
  leads: number | null
  revenueEur: number | null
  /** CA attribué / dépense — null si l'un des deux manque. */
  roas: number | null
}

export interface MonthlyReportData {
  client: Client
  monthLabel: string
  periodStart: number
  periodEnd: number
  published: Post[]
  createdCount: number
  totals: MonthlyReportTotals
  byPlatform: Array<{ platform: string; posts: number; reach: number; interactions: number }>
  topPosts: Post[]
  pillarCoverage: Array<{ pillar: string; count: number }>
  objective: { key: BusinessObjective; label: string } | null
  playbookKpis: string[]
  scheduledNextMonth: number
  prevMonthTotals: { postsPublished: number; reach: number; interactions: number } | null
  campaigns: MonthlyReportCampaign[]
}

const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                     'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function postInteractions(post: Post): number {
  return (post.metaInsights ?? []).reduce(
    (sum, i) => sum + (i.likes ?? 0) + (i.comments ?? 0) + (i.shares ?? 0) + (i.saves ?? 0),
    0
  )
}

function sumTotals(posts: Post[]): MonthlyReportTotals {
  let reach = 0
  let impressions = 0
  let interactions = 0
  for (const post of posts) {
    for (const i of post.metaInsights ?? []) {
      reach += i.reach ?? 0
      impressions += i.impressions ?? 0
      interactions += (i.likes ?? 0) + (i.comments ?? 0) + (i.shares ?? 0) + (i.saves ?? 0)
    }
  }
  return {
    postsPublished: posts.length,
    reach,
    impressions,
    interactions,
    engagementRate: reach > 0 ? parseFloat(((interactions / reach) * 100).toFixed(1)) : null,
  }
}

function publishedIn(posts: Post[], start: number, end: number): Post[] {
  return posts
    .filter(p => p.status === 'published' && p.publishedAt && p.publishedAt >= start && p.publishedAt < end)
    .sort((a, b) => (a.publishedAt ?? 0) - (b.publishedAt ?? 0))
}

export function parseMonthParam(monthParam: string | undefined): { year: number; month: number } {
  const now = new Date()
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split('-').map(Number)
    if (m >= 1 && m <= 12) return { year: y, month: m - 1 }
  }
  return { year: now.getFullYear(), month: now.getMonth() }
}

export async function buildMonthlyReport(clientId: string, monthParam?: string): Promise<MonthlyReportData | null> {
  const client = await getClient(clientId)
  if (!client) return null

  const { year, month } = parseMonthParam(monthParam)
  const periodStart = new Date(year, month, 1).getTime()
  const periodEnd = new Date(year, month + 1, 1).getTime()
  const prevStart = new Date(year, month - 1, 1).getTime()
  const nextEnd = new Date(year, month + 2, 1).getTime()

  const allPosts = await listPosts({ clientId, limit: 500 })

  const published = publishedIn(allPosts, periodStart, periodEnd)
  const prevPublished = publishedIn(allPosts, prevStart, periodStart)
  const createdCount = allPosts.filter(p => p.createdAt >= periodStart && p.createdAt < periodEnd).length
  const scheduledNextMonth = allPosts.filter(p =>
    p.status === 'scheduled' && p.scheduledAt && p.scheduledAt >= periodEnd && p.scheduledAt < nextEnd
  ).length

  const totals = sumTotals(published)
  const prevTotals = sumTotals(prevPublished)

  // Répartition par plateforme (un post multi-plateformes compte sur chacune)
  const platformMap = new Map<string, { posts: number; reach: number; interactions: number }>()
  for (const post of published) {
    for (const insight of post.metaInsights ?? []) {
      const entry = platformMap.get(insight.platform) ?? { posts: 0, reach: 0, interactions: 0 }
      entry.posts += 1
      entry.reach += insight.reach ?? 0
      entry.interactions += (insight.likes ?? 0) + (insight.comments ?? 0) + (insight.shares ?? 0) + (insight.saves ?? 0)
      platformMap.set(insight.platform, entry)
    }
  }
  const byPlatform = Array.from(platformMap.entries())
    .map(([platform, stats]) => ({ platform, ...stats }))
    .sort((a, b) => b.reach - a.reach)

  const topPosts = [...published]
    .sort((a, b) => postInteractions(b) - postInteractions(a))
    .slice(0, 3)

  const pillars = client.strategy?.contentPillars ?? []
  const pillarCoverage = pillars.map(pillar => ({
    pillar,
    count: published.filter(p =>
      `${p.brief} ${p.caption}`.toLowerCase().includes(pillar.toLowerCase())
    ).length,
  }))

  const objectiveKey = client.businessProfile?.priorityObjective ?? null
  const objective = objectiveKey
    ? { key: objectiveKey, label: BUSINESS_OBJECTIVES[objectiveKey]?.label ?? objectiveKey }
    : null

  const playbookKpis = getPlaybookForClient(client).kpis

  // Campagnes dont la période chevauche le mois (ou créées dans le mois si sans dates).
  // try/catch : la table peut manquer si la migration n'a pas encore été appliquée en prod.
  let campaigns: MonthlyReportCampaign[] = []
  try {
    const allCampaigns = await listCampaigns({ clientId })
    campaigns = allCampaigns
      .filter(c => {
        if (c.status === 'draft') return false
        if (c.startAt && c.endAt) return c.startAt < periodEnd && c.endAt >= periodStart
        return c.createdAt >= periodStart && c.createdAt < periodEnd
      })
      .map(c => {
        const spend = c.results?.spendEur ?? null
        const revenue = c.results?.revenueEur ?? null
        return {
          id: c.id,
          name: c.name,
          channel: c.channel,
          spendEur: spend,
          leads: c.results?.leads ?? null,
          revenueEur: revenue,
          roas: spend && spend > 0 && revenue && revenue > 0
            ? parseFloat((revenue / spend).toFixed(1))
            : null,
        }
      })
  } catch {
    campaigns = []
  }

  return {
    client,
    monthLabel: `${MONTH_NAMES[month]} ${year}`,
    periodStart,
    periodEnd,
    published,
    createdCount,
    totals,
    byPlatform,
    topPosts,
    pillarCoverage,
    objective,
    playbookKpis,
    scheduledNextMonth,
    prevMonthTotals: prevPublished.length > 0
      ? { postsPublished: prevTotals.postsPublished, reach: prevTotals.reach, interactions: prevTotals.interactions }
      : null,
    campaigns,
  }
}

/** Taux d'engagement d'un post individuel (moyenne des plateformes), pour le tableau. */
export function postEngagementRate(post: Post): number | null {
  if (!post.metaInsights?.length) return null
  let sum = 0
  let n = 0
  for (const i of post.metaInsights) {
    const reach = i.reach ?? 0
    if (reach === 0) continue
    sum += ((i.likes ?? 0) + (i.comments ?? 0) + (i.shares ?? 0)) / reach * 100
    n++
  }
  return n ? parseFloat((sum / n).toFixed(2)) : null
}

/** Delta en % vs mois précédent — null si base absente ou nulle. */
export function deltaPct(current: number, previous: number | undefined | null): number | null {
  if (previous === undefined || previous === null || previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}
