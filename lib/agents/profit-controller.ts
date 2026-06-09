import { getClient } from '@/lib/db/queries/clients'
import { getClientFinanceSettings } from '@/lib/db/queries/finance'
import { queryOne } from '@/lib/db'
import type { ProfitReport } from '@/types/finance'

const EUR_PER_USD = 0.93

const COST_ASSUMPTIONS = {
  fallbackPostApiCost: 0.12,
  imageAnalysisCost: 0.009,
  daSynthesisCost: 0.05,
  generatedImageCost: 0.04,
  generatedVideoCost: 0.35,
}

export const PROFIT_CONTROLLER_CONTROL_GATE = {
  cadence: 'post-campaign/monthly',
  role: 'Control margin, budget use and expensive deliverables before scaling production.',
  realData: [
    'stored post API cost',
    'stored post token usage',
    'generated post count',
    'analyzed image count',
    'DA synthesis count',
    'client finance settings',
  ],
  estimatedData: [
    'image analysis unit cost',
    'DA synthesis unit cost',
    'generated image unit cost',
    'generated video unit cost',
    'fallback API cost per remaining post',
    'internal time cost from configured hours and hourly rate',
  ],
  warnBefore: [
    'margin drops below target',
    'API budget use exceeds 85%',
    'planned videos leave less than 10 points of margin buffer',
  ],
  blockBefore: [
    'projected client profit is negative',
    'monthly retainer is missing for a paid production plan',
    'expensive video or ad spend is requested without configured budget assumptions',
  ],
} as const

interface CurrentMonthCostRow {
  posts_count: number
  post_api_cost: number
  tokens_used: number
}

interface CurrentMonthAssetRow {
  images_analyzed: number
  da_syntheses: number
}

export async function runProfitController(clientId: string): Promise<ProfitReport> {
  const client = await getClient(clientId)
  if (!client) throw new Error('Client introuvable')

  const settings = await getClientFinanceSettings(clientId)
  const monthStart = startOfMonth()
  const monthLabel = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const [postCosts, assetCosts] = await Promise.all([
    queryOne<CurrentMonthCostRow>(
      `SELECT
        COUNT(*) as posts_count,
        COALESCE(SUM(cost), 0) as post_api_cost,
        COALESCE(SUM(tokens_used), 0) as tokens_used
       FROM posts
       WHERE client_id = ? AND created_at >= ?`,
      [clientId, monthStart]
    ),
    queryOne<CurrentMonthAssetRow>(
      `SELECT
        COUNT(CASE WHEN a.type = 'image' AND a.analyzed_at IS NOT NULL AND a.analyzed_at >= ? THEN 1 END) as images_analyzed,
        COALESCE((
          SELECT COUNT(*)
          FROM client_visual_identity vi
          WHERE vi.client_id = ? AND vi.analyzed_at IS NOT NULL AND vi.analyzed_at >= ?
        ), 0) as da_syntheses
       FROM client_assets a
       WHERE a.client_id = ?`,
      [monthStart, clientId, monthStart, clientId]
    ),
  ])

  const postsGenerated = postCosts?.posts_count ?? 0
  const actualPostApiCost = usdToEur(postCosts?.post_api_cost ?? 0)
  const imagesAnalyzed = assetCosts?.images_analyzed ?? 0
  const daSyntheses = assetCosts?.da_syntheses ?? 0
  const actualAnalysisCost = (imagesAnalyzed * COST_ASSUMPTIONS.imageAnalysisCost) + (daSyntheses * COST_ASSUMPTIONS.daSynthesisCost)
  const actualApiCost = roundMoney(actualPostApiCost + actualAnalysisCost)

  const remainingPosts = Math.max(settings.plannedPostsPerMonth - postsGenerated, 0)
  const observedCostPerPost = postsGenerated > 0 ? actualPostApiCost / postsGenerated : 0
  const postApiUnitCost = Math.max(observedCostPerPost, COST_ASSUMPTIONS.fallbackPostApiCost)
  const plannedImageCost = settings.plannedImagesPerMonth * COST_ASSUMPTIONS.generatedImageCost
  const plannedVideoCost = settings.plannedVideosPerMonth * COST_ASSUMPTIONS.generatedVideoCost
  const remainingPostCost = remainingPosts * postApiUnitCost
  const projectedApiCost = roundMoney(Math.max(actualApiCost + remainingPostCost + plannedImageCost + plannedVideoCost, actualApiCost))

  const adSpend = roundMoney(settings.monthlyMetaAdsBudget + settings.monthlyGoogleAdsBudget)
  const internalCost = roundMoney(settings.hourlyInternalRate * settings.monthlyInternalHours)
  const totalCost = roundMoney(projectedApiCost + adSpend + internalCost)
  const revenue = settings.monthlyRetainer
  const profit = roundMoney(revenue - totalCost)
  const marginPct = revenue > 0 ? roundPct((profit / revenue) * 100) : 0
  const costPerPlannedPost = settings.plannedPostsPerMonth > 0
    ? roundMoney(totalCost / settings.plannedPostsPerMonth)
    : totalCost

  return {
    clientId,
    clientName: client.name,
    status: resolveStatus(revenue, marginPct, settings.targetMarginPct, profit),
    monthLabel,
    revenue,
    targetMarginPct: settings.targetMarginPct,
    currentMonth: {
      postsGenerated,
      imagesAnalyzed,
      daSyntheses,
      apiCost: actualApiCost,
      tokensUsed: postCosts?.tokens_used ?? 0,
    },
    forecast: {
      projectedApiCost,
      adSpend,
      internalCost,
      totalCost,
      profit,
      marginPct,
      costPerPlannedPost,
    },
    budgetUse: {
      apiPct: settings.monthlyApiBudget > 0 ? roundPct((projectedApiCost / settings.monthlyApiBudget) * 100) : 0,
      totalCostPct: revenue > 0 ? roundPct((totalCost / revenue) * 100) : 0,
    },
    recommendations: buildRecommendations({
      revenue,
      profit,
      marginPct,
      targetMarginPct: settings.targetMarginPct,
      apiPct: settings.monthlyApiBudget > 0 ? (projectedApiCost / settings.monthlyApiBudget) * 100 : 0,
      adSpend,
      internalCost,
      plannedVideos: settings.plannedVideosPerMonth,
      plannedPosts: settings.plannedPostsPerMonth,
      postsGenerated,
    }),
    assumptions: [
      'Les coûts IA déjà stockés sur les posts sont utilisés comme base réelle du mois.',
      `Les coûts image/vision/video non facturés précisément sont estimés : image ${formatEuro(COST_ASSUMPTIONS.generatedImageCost)}, vidéo ${formatEuro(COST_ASSUMPTIONS.generatedVideoCost)}.`,
      'Les budgets Meta Ads et Google Ads sont comptés comme charges si tu les inclus dans l’abonnement client.',
      'Le temps interne est valorisé avec ton taux horaire configuré pour obtenir une marge réaliste.',
    ],
    settings,
  }
}

function startOfMonth() {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function resolveStatus(revenue: number, marginPct: number, targetMarginPct: number, profit: number): ProfitReport['status'] {
  if (revenue <= 0) return 'missing_budget'
  if (profit < 0) return 'loss'
  if (marginPct < targetMarginPct) return 'watch'
  return 'profitable'
}

function buildRecommendations(input: {
  revenue: number
  profit: number
  marginPct: number
  targetMarginPct: number
  apiPct: number
  adSpend: number
  internalCost: number
  plannedVideos: number
  plannedPosts: number
  postsGenerated: number
}) {
  const recommendations: string[] = []

  if (input.revenue <= 0) {
    recommendations.push('Renseigner l’abonnement mensuel client pour calculer la marge réelle.')
  }
  if (input.profit < 0) {
    recommendations.push('Client prévu en perte : augmenter le forfait, réduire les budgets pub inclus, ou baisser le volume de livrables.')
  } else if (input.marginPct < input.targetMarginPct) {
    recommendations.push(`Marge sous l’objectif (${input.marginPct}% vs ${input.targetMarginPct}%) : revoir le volume de posts/images ou le prix d’abonnement.`)
  }
  if (input.apiPct > 85) {
    recommendations.push('Budget API presque consommé : router les tâches simples vers Ollama et limiter les régénérations image.')
  }
  if (input.plannedVideos > 0 && input.marginPct < input.targetMarginPct + 10) {
    recommendations.push('Vidéo IA coûteuse : réserver les reels aux campagnes ou aux clients avec marge suffisante.')
  }
  if (input.internalCost > input.revenue * 0.35 && input.revenue > 0) {
    recommendations.push('Temps interne trop lourd : standardiser le brief, réutiliser la DA et automatiser validation/calendrier.')
  }
  if (input.adSpend > input.revenue * 0.5 && input.revenue > 0) {
    recommendations.push('Budgets pub élevés dans le forfait : séparer idéalement “management fee” et “ad spend” facturé au client.')
  }
  if (input.postsGenerated > input.plannedPosts) {
    recommendations.push('Volume de posts supérieur au forfait : facturer les posts additionnels ou réduire les prochaines générations.')
  }
  if (recommendations.length === 0) {
    recommendations.push('Client rentable selon les paramètres actuels. Continuer à suivre coût API/post et marge mensuelle.')
  }

  return recommendations
}

function usdToEur(value: number) {
  return value * EUR_PER_USD
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

function roundPct(value: number) {
  return Math.round(value * 10) / 10
}

function formatEuro(value: number) {
  return `${value.toFixed(2)} €`
}
