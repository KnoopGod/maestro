import Anthropic from '@anthropic-ai/sdk'
import type { Client } from '@/types/client'
import type { PostInsights } from '@/types/post'
import { buildExpertSystemPrompt } from '@/lib/agents/prompts'
import { AGENT_MODELS, calcCost } from '@/lib/agents/config'

const GRAPH_API = 'https://graph.facebook.com/v23.0'

export type { PostInsights }

export interface PerformanceAnalysis {
  topPerformers: string[]
  patterns: string[]
  recommendations: string[]
  summary: string
}

export interface PerformanceResult {
  analysis: PerformanceAnalysis
  cost: number
  tokensUsed: number
  model: string
}

// ─── Meta insights fetchers ───────────────────────────────────────────────────

export async function fetchFacebookInsights(
  fbPostId: string,
  pageAccessToken: string
): Promise<PostInsights | null> {
  try {
    const fields = [
      'likes.summary(true)',
      'comments.summary(true)',
      'shares',
      'insights.metric(post_impressions,post_impressions_unique)',
    ].join(',')
    const res = await fetch(
      `${GRAPH_API}/${fbPostId}?fields=${fields}&access_token=${pageAccessToken}`
    )
    const data = await res.json()
    if (!res.ok || data.error) return null

    const insightValues = (data.insights?.data ?? []) as Array<{ name: string; values: Array<{ value: number }> }>
    const getMetric = (name: string) =>
      insightValues.find(d => d.name === name)?.values?.[0]?.value ?? 0

    return {
      platform: 'facebook',
      likes: data.likes?.summary?.total_count ?? 0,
      comments: data.comments?.summary?.total_count ?? 0,
      shares: data.shares?.count ?? 0,
      reach: getMetric('post_impressions_unique'),
      impressions: getMetric('post_impressions'),
      fetchedAt: Date.now(),
    }
  } catch {
    return null
  }
}

export async function fetchInstagramInsights(
  igMediaId: string,
  accessToken: string
): Promise<PostInsights | null> {
  try {
    const fields = 'like_count,comments_count,insights.metric(reach,impressions,shares,saved)'
    const res = await fetch(
      `${GRAPH_API}/${igMediaId}?fields=${fields}&access_token=${accessToken}`
    )
    const data = await res.json()
    if (!res.ok || data.error) return null

    const insightValues = (data.insights?.data ?? []) as Array<{ name: string; values: Array<{ value: number }> }>
    const getMetric = (name: string) =>
      insightValues.find(d => d.name === name)?.values?.[0]?.value ?? 0

    return {
      platform: 'instagram',
      likes: data.like_count ?? 0,
      comments: data.comments_count ?? 0,
      shares: getMetric('shares'),
      reach: getMetric('reach'),
      impressions: getMetric('impressions'),
      saves: getMetric('saved'),
      fetchedAt: Date.now(),
    }
  } catch {
    return null
  }
}

// ─── Claude analysis ──────────────────────────────────────────────────────────

interface PostData {
  caption: string
  platforms: string[]
  brief: string
  publishedAt: number | null
  insights: PostInsights[]
}

export async function analyzePerformance(input: {
  client: Client
  posts: PostData[]
}): Promise<PerformanceResult> {
  const { client, posts } = input
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey || posts.length === 0) {
    return { analysis: fallbackAnalysis(posts), cost: 0, tokensUsed: 0, model: 'fallback' }
  }

  const systemPrompt = buildExpertSystemPrompt('performance-analyst', `Tu es **Performance Analyst**, analyste social media HORECA senior avec 10 ans d'expérience benchmarking.
Tu connais les taux d'engagement de référence par plateforme et par type d'établissement HORECA en France.

## Benchmarks que tu utilises pour contextualiser les données

### Taux d'engagement de référence (likes + commentaires + partages / reach)
- Restaurant Instagram : bon = 3-6%, moyen = 1-3%, faible = <1%
- Restaurant Facebook : bon = 2-4%, moyen = 0.5-2%, faible = <0.5%
- Bar Instagram : bon = 4-8% (audience plus jeune, plus réactive)
- Hôtel Instagram : bon = 1.5-3% (audience cherche inspiration, moins impulsive)
- B&B Instagram : bon = 3-5% (communauté de niche, fidèle)

### Signaux de performance à détecter
- Saves Instagram élevés → contenu utile/aspirationnel (menus, ambiance)
- Partages Facebook élevés → contenu émotionnel ou "tagger un ami"
- Commentaires élevés → contenu qui pose une question ou déclenche un avis
- Reach élevé mais engagement faible → viralité sans conversion, revoir le CTA
- Reach faible mais engagement élevé → communauté fidèle, audience de niche (pas un problème)

### Patterns récurrents qui indiquent une direction claire
- Coulisses surperforment les plats → augmenter la fréquence behind-the-scenes
- Posts avec prénom du chef surperforment les posts anonymes → humaniser systématiquement
- Posts du jeudi/vendredi surperforment → renforcer cette fenêtre pour CTA commerciaux
- Carousels surperforment les posts seuls → proposer plus de formats multi-images
- Posts avec hashtags locaux surperforment → raffiner la stratégie hashtag

## Ce que tu produis
3 recommandations concrètes, actionnables immédiatement par le Social Expert.
Chaque recommandation doit être spécifique (pas "améliorer l'engagement" mais "publier le jeudi à 17h avec un post coulisses — tes 3 meilleurs posts sont tous ce format-là").

Réponds en français, en JSON strict, sans markdown.`)

  const postsData = posts.slice(0, 10).map((p, i) => ({
    num: i + 1,
    brief: p.brief,
    caption_debut: p.caption.slice(0, 120),
    platforms: p.platforms,
    insights: p.insights.map(ins => ({
      platform: ins.platform,
      likes: ins.likes,
      comments: ins.comments,
      shares: ins.shares,
      reach: ins.reach,
      impressions: ins.impressions,
      saves: ins.saves,
    })),
  }))

  const userPrompt = `# CLIENT
${client.name} · ${client.type} · ${client.city || '—'}
Ton : ${client.brandVoiceTone || 'non renseigné'}
Stratégie : ${(client.strategy as { objective?: string } | null)?.objective || 'non renseigné'}

# POSTS PUBLIÉS (${posts.length} total, ${postsData.length} affichés)
${JSON.stringify(postsData, null, 2)}

# TÂCHE
Identifie les posts qui surperforment, les patterns récurrents (format, horaire, sujet, ton), et formule exactement 3 recommandations concrètes pour améliorer les prochains posts.

Réponds en JSON strict, sans backticks, exactement ce format :
{
  "topPerformers": ["Post #N : raison courte de sa performance"],
  "patterns": ["Pattern observé court"],
  "recommendations": ["Recommandation actionnable en 1-2 phrases"],
  "summary": "Synthèse en 2-3 phrases."
}`

  try {
    const claude = new Anthropic({ apiKey })
    const message = await claude.messages.create({
      model: AGENT_MODELS.opus,
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high' },
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const textBlock = message.content.find(b => b.type === 'text')
    const rawText = textBlock && textBlock.type === 'text' ? textBlock.text : ''

    let parsed: PerformanceAnalysis
    try {
      const clean = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
      parsed = JSON.parse(clean)
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Réponse non parsable')
      parsed = JSON.parse(match[0])
    }

    const inputTokens = message.usage.input_tokens
    const outputTokens = message.usage.output_tokens
    const cost = calcCost('opus', inputTokens, outputTokens)

    return {
      analysis: normalizeAnalysis(parsed),
      cost,
      tokensUsed: inputTokens + outputTokens,
      model: AGENT_MODELS.opus,
    }
  } catch {
    return { analysis: fallbackAnalysis(posts), cost: 0, tokensUsed: 0, model: 'fallback' }
  }
}

function normalizeAnalysis(raw: PerformanceAnalysis): PerformanceAnalysis {
  return {
    topPerformers: Array.isArray(raw.topPerformers) ? raw.topPerformers.slice(0, 3) : [],
    patterns: Array.isArray(raw.patterns) ? raw.patterns.slice(0, 5) : [],
    recommendations: Array.isArray(raw.recommendations) ? raw.recommendations.slice(0, 3) : [],
    summary: raw.summary || 'Analyse effectuée.',
  }
}

function fallbackAnalysis(posts: PostData[]): PerformanceAnalysis {
  const withInsights = posts.filter(p => p.insights.length > 0)
  const totalReach = withInsights.reduce(
    (s, p) => s + p.insights.reduce((a, i) => a + i.reach, 0),
    0
  )
  return {
    topPerformers: [],
    patterns: withInsights.length > 0
      ? [`${withInsights.length} posts avec métriques disponibles`]
      : ['Pas encore de métriques Meta disponibles'],
    recommendations: [
      'Connecter un compte Meta pour récupérer les métriques réelles.',
      'Publier régulièrement pour établir des patterns de performance.',
      'Activer la DA client pour renforcer la cohérence visuelle.',
    ],
    summary: totalReach > 0
      ? `${withInsights.length} posts analysés pour un reach total de ${totalReach.toLocaleString()}.`
      : 'Aucune métrique Meta disponible. Publiez et récupérez les insights post-publication.',
  }
}
