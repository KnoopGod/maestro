/**
 * Strategy Advisor — reads the full client profile and generates
 * a detailed marketing strategy with actionable recommendations.
 */
import Anthropic from '@anthropic-ai/sdk'
import type { Client } from '@/types/client'

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

  const prompt = `Tu es un **expert en marketing digital HORECA** avec 15 ans d'expérience.
Analyse ce profil client et génère une stratégie marketing complète, précise et actionnable.

# PROFIL CLIENT

**Nom :** ${client.name}
**Type :** ${client.type}
**Ville :** ${client.city || 'non renseignée'}
**Description :** ${client.description || 'non renseignée'}

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

Génère une stratégie marketing détaillée et adaptée à ce client HORECA spécifique.
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
    model: 'claude-opus-4-7',
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high' },
    messages: [{ role: 'user', content: prompt }],
  })

  const textBlock = response.content.find(b => b.type === 'text')
  const raw = textBlock?.type === 'text' ? textBlock.text : ''

  const cost = (response.usage.input_tokens * 5 + response.usage.output_tokens * 25) / 1_000_000

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
  return {
    positioning: `${client.name} — ${client.type} authentique à ${client.city || 'votre ville'}`,
    uniqueAngle: 'Définissez ce qui vous rend unique localement',
    contentPillars: [
      { name: 'Produits & Offres', description: 'Mettre en avant vos plats/chambres/cocktails phares', examples: ['Photo du plat du jour', 'Offre spéciale weekend'], frequency: '2x/semaine' },
      { name: 'Coulisses', description: 'Humaniser votre établissement', examples: ['La préparation en cuisine', 'L\'équipe en action'], frequency: '1x/semaine' },
      { name: 'Ambiance & Lifestyle', description: 'Vendre une expérience', examples: ['L\'atmosphère du soir', 'La terrasse au soleil'], frequency: '2x/semaine' },
    ],
    platformStrategy: [
      { platform: 'instagram', tone: 'Chaleureux et visuel', contentTypes: ['photos', 'reels', 'stories'], bestTimes: '12h et 19h en semaine', specificTips: 'Miser sur les visuels de qualité' },
      { platform: 'facebook', tone: 'Informatif et local', contentTypes: ['posts', 'events', 'photos'], bestTimes: '10h et 18h', specificTips: 'Promouvoir les événements locaux' },
    ],
    keyMessages: ['Qualité et authenticité', 'Ancré dans la communauté locale', 'Expérience unique'],
    hashtagClusters: [
      { theme: 'local', tags: [`#${client.city?.toLowerCase() || 'local'}`, '#horeca', '#restaurant'] },
    ],
    monthlyPlan: [
      { week: 'Semaine 1', focus: 'Présentation', postIdeas: ['Présentation de l\'équipe', 'Photo signature'] },
      { week: 'Semaine 2', focus: 'Offre phare', postIdeas: ['Plat/offre du moment', 'Témoignage client'] },
      { week: 'Semaine 3', focus: 'Coulisses', postIdeas: ['Préparation en cuisine', 'Sourcing local'] },
      { week: 'Semaine 4', focus: 'Engagement', postIdeas: ['Question à la communauté', 'Sondage stories'] },
    ],
    doNotDo: ['Posts sans visuels', 'Trop de promotions', 'Ignorer les commentaires'],
    quickWins: ['Activer les stories quotidiennes', 'Répondre à tous les avis Google', 'Poster les menus du jour'],
    cost: 0,
  }
}
