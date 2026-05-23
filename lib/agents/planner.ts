import Anthropic from '@anthropic-ai/sdk'
import type { Client } from '@/types/client'
import type { PostPlatform } from '@/types/post'

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
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      ideas: fallbackIdeas(client, count),
      cost: 0,
      tokensUsed: 0,
      model: 'fallback',
    }
  }

  const systemPrompt = `Tu es **Strategy Director** pour Maestro, agence HORECA.
Tu pilotes la planification de contenu social pour chaque client.

Tes principes :
1. Chaque idée doit servir un pilier de la stratégie client.
2. Chaque idée doit être actionnable : un brief prêt à envoyer au générateur.
3. Pas de redite : varier les angles (offre, ambiance, preuve sociale, local, coulisses, saisonnalité).
4. Respect strict du ton et des mots à éviter.

Réponds en JSON strict, sans markdown.`

  const platforms = client.strategy.platforms.length ? client.strategy.platforms : ['instagram', 'facebook']

  const userPrompt = `# CLIENT

**Établissement :** ${client.name}
**Type :** ${client.type}
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
      model: 'claude-opus-4-7',
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
    const cost = (inputTokens * 5 + outputTokens * 25) / 1_000_000

    return {
      ideas: ideas.length ? ideas : fallbackIdeas(client, count),
      cost: parseFloat(cost.toFixed(6)),
      tokensUsed: inputTokens + outputTokens,
      model: 'claude-opus-4-7',
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
  const pillars = client.strategy.contentPillars
  const platforms: PostPlatform[] = ['instagram', 'facebook']
  const city = client.city || ''
  const tone = client.brandVoiceTone || 'naturel'

  const all: PostIdea[] = [
    {
      title: 'Offre de la semaine',
      pillar: pillars[0] || 'Offre',
      objective: 'Déclencher une visite ou une réservation rapide.',
      brief: `Mettre en avant l'offre prioritaire de ${client.name}. Ton ${tone}, CTA clair pour réserver cette semaine.`,
      platforms,
      bestTime: client.strategy.bestTimes[0],
    },
    {
      title: 'Ambiance du lieu',
      pillar: pillars[1] || 'Ambiance',
      objective: 'Renforcer l\'image de marque et la mémorisation.',
      brief: `Capturer l'ambiance de ${client.name}${city ? ` à ${city}` : ''}. Ton ${tone}, focus sur le ressenti plutôt que sur l'offre.`,
      platforms,
      bestTime: client.strategy.bestTimes[1],
    },
    {
      title: 'Preuve sociale',
      pillar: pillars[3] || 'Avis client',
      objective: 'Rassurer et convertir avec un angle confiance.',
      brief: `Valoriser un avis ou un moment client de ${client.name}. Ton ${tone}, ne pas sur-promettre.`,
      platforms,
      bestTime: client.strategy.bestTimes[0],
    },
    {
      title: 'Moment local',
      pillar: 'Local',
      objective: `Ancrer ${client.name} dans la vie de ${city || 'la ville'}.`,
      brief: `Relier ${client.name} à un événement, saison ou particularité de ${city || 'la ville'}. Ton ${tone}.`,
      platforms,
      bestTime: client.strategy.bestTimes[2] || client.strategy.bestTimes[1],
    },
    {
      title: 'Réservation week-end',
      pillar: pillars[4] || 'Réservation',
      objective: 'Remplir les créneaux les plus rentables.',
      brief: `Inciter à réserver le week-end chez ${client.name}, sans tomber dans le ton commercial. Ton ${tone}.`,
      platforms,
      bestTime: client.strategy.bestTimes[2] || '18:30',
    },
  ]

  return all.slice(0, count)
}
