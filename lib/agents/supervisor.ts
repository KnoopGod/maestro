import Anthropic from '@anthropic-ai/sdk'
import type { Client } from '@/types/client'
import type { Post, SupervisorReview } from '@/types/post'
import {
  buildExpertSystemPrompt,
  createAgentQualityEnvelope,
  type AgentQualityEnvelope,
} from '@/lib/agents/prompts'

export interface SupervisorResult {
  review: SupervisorReview
  qualityEnvelope: AgentQualityEnvelope<SupervisorReview>
  cost: number
  tokensUsed: number
  model: string
}

export async function supervisePost(input: {
  client: Client
  post: Post
}): Promise<SupervisorResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    const review = fallbackSupervisorReview(input)
    return {
      review,
      qualityEnvelope: buildSupervisorEnvelope(review, ['ANTHROPIC_API_KEY absente : contrôle local limité.']),
      cost: 0,
      tokensUsed: 0,
      model: 'fallback',
    }
  }

  const { client, post } = input
  const systemPrompt = buildExpertSystemPrompt('supervisor', `Tu es **Claude Supervisor**, directeur qualité et critique éditorial pour CODEXRS, plateforme HORECA.

Ton rôle : relire chaque post avant publication, détecter les risques de marque, de conversion, de clarté, de cohérence locale et de qualité créative.

Tu es exigeant mais pragmatique :
- "ready" si le post peut être publié tel quel
- "revise" si le post est publiable mais mérite une amélioration
- "blocked" uniquement si publier nuirait clairement à la marque, crée une promesse trompeuse, contredit le brief/client, ou contient un problème sérieux

Réponds en français, en JSON strict, sans markdown.`)

  const userPrompt = `# CONTEXTE CLIENT

**Établissement :** ${client.name}
**Type :** ${client.type}
**Ville :** ${client.city || 'non renseignée'}
**Positionnement :** ${client.description || 'non renseigné'}

# VOIX DE MARQUE

**Ton :** ${client.brandVoiceTone || 'non renseigné'}
**Mots-clés :** ${client.brandVoiceKeywords || 'non renseignés'}
**À éviter :** ${client.brandVoiceAvoid || 'non renseigné'}

# STRATÉGIE CLIENT

**Objectif :** ${client.strategy.objective}
**À éviter stratégiquement :** ${client.strategy.avoid.join(', ') || 'non renseigné'}

# POST À SUPERVISER

**Brief :** ${post.brief}
**Plateformes :** ${post.platforms.join(', ')}
**Caption :** ${post.caption}
**Hashtags :** ${post.hashtags.join(', ') || 'aucun'}
**Hook :** ${post.hook || 'non renseigné'}
**CTA :** ${post.cta || 'non renseigné'}
**Prompt image :** ${post.imagePrompt || 'non renseigné'}
**Score impact actuel :** ${post.impactScore}/100

# TÂCHE

Évalue ce post avant publication Meta. Juge la cohérence avec le client, la qualité HORECA, le potentiel de conversion, les risques de promesse, et l'adéquation plateforme.

**Réponds en JSON strict, sans backticks, sans markdown, exactement ce format :**

{
  "verdict": "ready",
  "score": 85,
  "summary": "Avis court en 1-2 phrases.",
  "risks": ["Risque court"],
  "improvements": ["Amélioration courte"],
  "nextAction": "Une seule phrase actionnable."
}`

  try {
    const claude = new Anthropic({ apiKey })
    const message = await claude.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 2048,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high' },
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const textBlock = message.content.find(b => b.type === 'text')
    const rawText = textBlock && textBlock.type === 'text' ? textBlock.text : ''

    let parsed: SupervisorReview
    try {
      const cleanText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
      parsed = JSON.parse(cleanText)
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Réponse non parsable comme JSON')
      parsed = JSON.parse(match[0])
    }

    const inputTokens = message.usage.input_tokens
    const outputTokens = message.usage.output_tokens
    const cost = (inputTokens * 5 + outputTokens * 25) / 1_000_000

    const review = normalizeReview(parsed, post.impactScore)

    return {
      review,
      qualityEnvelope: buildSupervisorEnvelope(review),
      cost: parseFloat(cost.toFixed(6)),
      tokensUsed: inputTokens + outputTokens,
      model: 'claude-opus-4-7',
    }
  } catch {
    const review = fallbackSupervisorReview(input)
    return {
      review,
      qualityEnvelope: buildSupervisorEnvelope(review, ['Claude indisponible ou réponse non parsable : fallback local utilisé.']),
      cost: 0,
      tokensUsed: 0,
      model: 'fallback',
    }
  }
}

export function fallbackSupervisorReview(input: { client: Client; post: Post }): SupervisorReview {
  const { post } = input
  const hasImage = Boolean(post.imageUrl)
  const hasCta = /réserv|contact|message|découvr|book|dm|appel|passez/i.test(post.caption)
  const captionLength = post.caption.trim().length
  const hashtagCount = post.hashtags.length
  const hasReasonableCaptionLength = captionLength >= 50 && captionLength <= 1500
  const hasHashtagsInRange = hashtagCount >= 3 && hashtagCount <= 12

  const score = clampScore(
    70 +
      (hasImage ? 5 : 0) +
      (hasCta ? 5 : 0) +
      (hasHashtagsInRange ? 5 : 0) -
      (hasReasonableCaptionLength ? 0 : 10)
  )

  const risks = [
    ...(!hasImage ? ['Aucun visuel associé au post.'] : []),
    ...(!hasCta ? ['CTA insuffisamment explicite pour convertir.'] : []),
    ...(!hasReasonableCaptionLength ? ['Longueur de caption à vérifier avant publication.'] : []),
    ...(!hasHashtagsInRange ? ['Nombre de hashtags hors plage recommandée.'] : []),
  ].slice(0, 5)

  const improvements = [
    ...(!hasImage ? ['Ajouter un visuel cohérent avec le brief.'] : []),
    ...(!hasCta ? ['Ajouter une invitation claire à réserver, contacter ou découvrir.'] : []),
    ...(!hasReasonableCaptionLength ? ['Ajuster la caption entre 50 et 1500 caractères.'] : []),
    ...(!hasHashtagsInRange ? ['Utiliser entre 3 et 12 hashtags ciblés.'] : []),
  ].slice(0, 5)

  return {
    verdict: score >= 80 && hasImage && hasCta ? 'ready' : 'revise',
    score,
    summary: 'Contrôle local sans Claude API : les critères de base sont vérifiés, mais la supervision créative reste limitée.',
    risks,
    improvements,
    nextAction: 'Ajouter ANTHROPIC_API_KEY pour obtenir une vraie supervision Claude.',
  }
}

function normalizeReview(review: SupervisorReview, fallbackScore: number): SupervisorReview {
  const verdicts: SupervisorReview['verdict'][] = ['ready', 'revise', 'blocked']
  const verdict = verdicts.includes(review.verdict) ? review.verdict : 'revise'

  return {
    verdict,
    score: clampScore(Number.isFinite(Number(review.score)) ? Number(review.score) : fallbackScore),
    summary: review.summary || 'Supervision effectuée.',
    risks: Array.isArray(review.risks) ? review.risks.slice(0, 5) : [],
    improvements: Array.isArray(review.improvements) ? review.improvements.slice(0, 5) : [],
    nextAction: review.nextAction || 'Relire le post avant publication.',
  }
}

function buildSupervisorEnvelope(
  review: SupervisorReview,
  assumptions: string[] = []
): AgentQualityEnvelope<SupervisorReview> {
  return createAgentQualityEnvelope({
    agentId: 'supervisor',
    confidence: review.score / 100,
    assumptions,
    risks: review.risks,
    recommendations: review.improvements,
    nextAgent: review.verdict === 'ready' ? 'publisher' : 'social-expert',
    payload: review,
  })
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)))
}
