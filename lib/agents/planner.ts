import Anthropic from '@anthropic-ai/sdk'
import type { Client } from '@/types/client'
import type { PostPlatform } from '@/types/post'
import { buildExpertSystemPrompt } from '@/lib/agents/prompts'
import { AGENT_MODELS, calcCost } from '@/lib/agents/config'
import { getPlaybookForClient } from '@/lib/playbooks'

export interface PostIdea {
  title: string
  pillar: string
  objective: string
  brief: string
  platforms: PostPlatform[]
  bestTime?: string
}

interface PlannerResult {
  ideas: PostIdea[]
  cost: number
  tokensUsed: number
  model: string
}

/**
 * Propose 5 post ideas tailored to a client's strategy, brand voice and city.
 * Falls back to a deterministic 5-idea list if no API key.
 */
export async function proposePostIdeas(client: Client, count = 5): Promise<PlannerResult> {
  const playbook = getPlaybookForClient(client)
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      ideas: fallbackIdeas(client, count),
      cost: 0,
      tokensUsed: 0,
      model: 'fallback',
    }
  }

  const systemPrompt = buildExpertSystemPrompt('strategy-director', `Tu es **Strategy Director** pour CODEXRS, spécialisé dans le secteur ${playbook.label}.
Tu pilotes la planification de contenu social pour chaque client.
Contexte métier prioritaire : ${playbook.promptContext}

Tes principes :
1. Chaque idée doit servir un pilier de la stratégie client.
2. Chaque idée doit être actionnable : un brief prêt à envoyer au générateur.
3. Pas de redite : varier les angles (offre, ambiance, preuve sociale, local, coulisses, saisonnalité).
4. Respect strict du ton et des mots à éviter.

Réponds en JSON strict, sans markdown.`)

  const platforms = client.strategy.platforms.length ? client.strategy.platforms : ['instagram', 'facebook']

  const userPrompt = `# CLIENT

**Établissement :** ${client.name}
**Type d'activité :** ${playbook.label}
**Ville :** ${client.city || 'non renseignée'}
**Description :** ${client.description || 'non renseignée'}

# VOIX DE MARQUE

**Ton :** ${client.brandVoiceTone || 'non renseigné'}
**Mots-clés :** ${client.brandVoiceKeywords || 'libre'}
**À éviter :** ${client.brandVoiceAvoid || 'rien de particulier'}

# STRATÉGIE

**Objectif :** ${client.strategy.objective}
**Piliers de contenu :** ${client.strategy.contentPillars.join(', ')}
**Fréquence :** ${client.strategy.frequency}
**Meilleurs créneaux :** ${client.strategy.bestTimes.join(', ')}
**À éviter stratégiquement :** ${client.strategy.avoid.join(', ')}

# TÂCHE

Propose ${count} idées de posts ${platforms.join(' + ')} pour les 10 prochains jours.
Couvre des angles variés (pas plus d'une idée par pilier).

Réponds en JSON strict, sans backticks, sans markdown, exactement ce format :

{
  "ideas": [
    {
      "title": "Nom court (max 6 mots)",
      "pillar": "Un des piliers ci-dessus",
      "objective": "Objectif business concret (1 phrase)",
      "brief": "Brief de 2-3 phrases prêt à envoyer au générateur de posts",
      "platforms": ["instagram", "facebook"],
      "bestTime": "HH:MM (optionnel, dans les meilleurs créneaux)"
    }
  ]
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

    let parsed: { ideas: PostIdea[] }
    try {
      const cleanText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
      parsed = JSON.parse(cleanText)
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Réponse non parsable comme JSON')
      parsed = JSON.parse(match[0])
    }

    const ideas = Array.isArray(parsed.ideas)
      ? parsed.ideas.slice(0, count).map(normalizeIdea)
      : []

    const inputTokens = message.usage.input_tokens
    const outputTokens = message.usage.output_tokens
    const cost = calcCost('opus', inputTokens, outputTokens)

    return {
      ideas: ideas.length ? ideas : fallbackIdeas(client, count),
      cost,
      tokensUsed: inputTokens + outputTokens,
      model: AGENT_MODELS.opus,
    }
  } catch {
    return {
      ideas: fallbackIdeas(client, count),
      cost: 0,
      tokensUsed: 0,
      model: 'fallback',
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeIdea(idea: PostIdea): PostIdea {
  const validPlatforms: PostPlatform[] = ['instagram', 'facebook', 'tiktok', 'linkedin']
  const platforms = Array.isArray(idea.platforms)
    ? idea.platforms.filter((p): p is PostPlatform => validPlatforms.includes(p as PostPlatform))
    : []
  return {
    title: idea.title || 'Idée',
    pillar: idea.pillar || '',
    objective: idea.objective || '',
    brief: idea.brief || '',
    platforms: platforms.length ? platforms : ['instagram', 'facebook'],
    bestTime: idea.bestTime,
  }
}

function fallbackIdeas(client: Client, count: number): PostIdea[] {
  const playbook = getPlaybookForClient(client)
  const pillars = client.strategy.contentPillars.length
    ? client.strategy.contentPillars
    : playbook.strategy.contentPillars
  const platforms = client.strategy.platforms.length
    ? client.strategy.platforms
    : playbook.campaignTemplates[0]?.platforms ?? ['instagram', 'facebook']
  const city = client.city || ''
  const tone = client.brandVoiceTone || 'naturel'

  const all: PostIdea[] = pillars.map((pillar, index) => ({
    title: pillar,
    pillar,
    objective: `Servir l'objectif commercial de ${client.name} avec le pilier « ${pillar} ».`,
    brief: `Créer un contenu sur « ${pillar} » pour ${client.name}${city ? ` à ${city}` : ''}. Ton ${tone}. Apporter une preuve concrète et terminer par un CTA adapté aux canaux prioritaires.`,
    platforms,
    bestTime: client.strategy.bestTimes[index % Math.max(client.strategy.bestTimes.length, 1)]
      ?? playbook.strategy.bestTimes[index % Math.max(playbook.strategy.bestTimes.length, 1)],
  }))

  return all.slice(0, count)
}
