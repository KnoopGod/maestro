/**
 * Strategy Advisor — reads the full client profile and generates
 * a detailed marketing strategy with actionable recommendations.
 */
import Anthropic from '@anthropic-ai/sdk'
import type { Client } from '@/types/client'
import { AGENT_MODELS, calcCost } from '@/lib/agents/config'
import { getPlaybookForClient } from '@/lib/playbooks'

export interface StrategyAdvice {
  positioning: string
  uniqueAngle: string
  contentPillars: Array<{
    name: string
    description: string
    examples: string[]
    frequency: string
  }>
  platformStrategy: Array<{
    platform: string
    tone: string
    contentTypes: string[]
    bestTimes: string
    specificTips: string
  }>
  keyMessages: string[]
  hashtagClusters: Array<{ theme: string; tags: string[] }>
  monthlyPlan: Array<{ week: string; focus: string; postIdeas: string[] }>
  doNotDo: string[]
  quickWins: string[]
  cost: number
}

export async function generateStrategyAdvice(client: Client): Promise<StrategyAdvice> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return fallbackStrategy(client)

  const anthropic = new Anthropic({ apiKey })
  const playbook = getPlaybookForClient(client)

  const prompt = `Tu es un **expert en marketing digital spécialisé dans le secteur ${playbook.label}** avec 15 ans d'expérience.
Analyse ce profil client et génère une stratégie marketing complète, précise et actionnable.

# PROFIL CLIENT

**Nom :** ${client.name}
**Type d'activité :** ${playbook.label}
**Ville :** ${client.city || 'non renseignée'}
**Description :** ${client.description || 'non renseignée'}
**Contexte métier :** ${playbook.promptContext}

## Voix de marque
- **Ton :** ${client.brandVoiceTone || 'non renseigné'}
- **Mots-clés :** ${client.brandVoiceKeywords || 'libre'}
- **À éviter :** ${client.brandVoiceAvoid || 'rien'}
- **Langues :** ${client.languages.join(', ')}

## Stratégie actuelle
- **Objectif :** ${client.strategy.objective || 'non défini'}
- **Piliers actuels :** ${client.strategy.contentPillars.join(', ') || 'aucun'}
- **Plateformes :** ${client.strategy.platforms.join(', ') || 'non définies'}
- **Fréquence :** ${client.strategy.frequency || 'non définie'}

# MISSION

Génère une stratégie marketing détaillée et adaptée à ce client et à son secteur.
Sois concret, local, et orienté résultats commerciaux.

Réponds en JSON strict sans markdown, avec cette structure exacte :
{
  "positioning": "phrase de positionnement unique",
  "uniqueAngle": "ce qui différencie vraiment ce client de la concurrence locale",
  "contentPillars": [
    {
      "name": "nom du pilier",
      "description": "pourquoi ce pilier pour ce client",
      "examples": ["exemple de post 1", "exemple de post 2", "exemple de post 3"],
      "frequency": "X fois par semaine"
    }
  ],
  "platformStrategy": [
    {
      "platform": "instagram",
      "tone": "ton adapté à cette plateforme pour ce client",
      "contentTypes": ["reels", "stories", "carrousels"],
      "bestTimes": "horaires optimaux",
      "specificTips": "conseil spécifique à ce client sur cette plateforme"
    }
  ],
  "keyMessages": ["message clé 1", "message clé 2", "message clé 3"],
  "hashtagClusters": [
    { "theme": "local", "tags": ["#tag1", "#tag2", "#tag3"] },
    { "theme": "niche", "tags": ["#tag1", "#tag2", "#tag3"] }
  ],
  "monthlyPlan": [
    { "week": "Semaine 1", "focus": "thème de la semaine", "postIdeas": ["idée 1", "idée 2"] },
    { "week": "Semaine 2", "focus": "thème", "postIdeas": ["idée 1", "idée 2"] },
    { "week": "Semaine 3", "focus": "thème", "postIdeas": ["idée 1", "idée 2"] },
    { "week": "Semaine 4", "focus": "thème", "postIdeas": ["idée 1", "idée 2"] }
  ],
  "doNotDo": ["erreur à éviter 1", "erreur à éviter 2"],
  "quickWins": ["action rapide à fort impact 1", "action rapide 2", "action rapide 3"]
}`

  const response = await anthropic.messages.create({
    model: AGENT_MODELS.opus,
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high' },
    messages: [{ role: 'user', content: prompt }],
  })

  const textBlock = response.content.find(b => b.type === 'text')
  const raw = textBlock?.type === 'text' ? textBlock.text : ''

  const cost = calcCost('opus', response.usage.input_tokens, response.usage.output_tokens)

  try {
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(clean)
    return { ...parsed, cost }
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) return { ...JSON.parse(match[0]), cost }
    return { ...fallbackStrategy(client), cost }
  }
}

function fallbackStrategy(client: Client): StrategyAdvice {
  const playbook = getPlaybookForClient(client)
  const platforms = Array.from(new Set(
    playbook.campaignTemplates.flatMap(template => template.platforms)
  )).slice(0, 3)

  return {
    positioning: `${client.name} — ${playbook.label} à ${client.city || 'votre ville'}`,
    uniqueAngle: 'Définissez ce qui vous rend unique localement',
    contentPillars: playbook.strategy.contentPillars.slice(0, 4).map(name => ({
      name,
      description: `Développer le pilier « ${name} » avec des preuves concrètes adaptées au client.`,
      examples: [`Présenter ${name.toLowerCase()}`, `Montrer une preuve liée à ${name.toLowerCase()}`],
      frequency: playbook.strategy.frequency,
    })),
    platformStrategy: (platforms.length ? platforms : ['instagram', 'facebook']).map(platform => ({
      platform,
      tone: 'Professionnel, humain et cohérent avec la marque',
      contentTypes: ['photos', 'vidéos courtes', 'témoignages'],
      bestTimes: playbook.strategy.bestTimes.join(', '),
      specificTips: playbook.promptContext,
    })),
    keyMessages: ['Expertise démontrée', 'Preuves concrètes', 'Action commerciale claire'],
    hashtagClusters: [
      { theme: 'local', tags: [`#${client.city?.toLowerCase() || 'local'}`, `#${playbook.vertical.replace(/-/g, '')}`] },
    ],
    monthlyPlan: [
      { week: 'Semaine 1', focus: playbook.strategy.contentPillars[0] ?? 'Présentation', postIdeas: ['Présentation de l’équipe', 'Preuve de savoir-faire'] },
      { week: 'Semaine 2', focus: playbook.strategy.contentPillars[1] ?? 'Offre phare', postIdeas: ['Offre ou service phare', 'Témoignage client'] },
      { week: 'Semaine 3', focus: playbook.strategy.contentPillars[2] ?? 'Coulisses', postIdeas: ['Coulisses du métier', 'Méthode ou expertise'] },
      { week: 'Semaine 4', focus: 'Conversion', postIdeas: ['Cas client', 'CTA vers le canal prioritaire'] },
    ],
    doNotDo: ['Posts sans visuels', 'Trop de promotions', 'Ignorer les commentaires'],
    quickWins: playbook.priorityChannels.slice(0, 3).map(channel => `Optimiser le canal ${channel}`),
    cost: 0,
  }
}
