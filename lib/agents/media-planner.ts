import Anthropic from '@anthropic-ai/sdk'
import type { Client } from '@/types/client'
import { BUSINESS_OBJECTIVES, CONVERSION_CHANNELS } from '@/types/client'
import type { CampaignChannel, MediaPlan, MetaAdCreative, GoogleAdCreative } from '@/types/campaign'
import { META_LIMITS, GOOGLE_LIMITS } from '@/types/campaign'
import { getPlaybookForClient } from '@/lib/playbooks'
import { AGENT_MODELS, calcCost } from '@/lib/agents/config'

// Prompt v1 — 2026-07 : plan média Phase 1 (achat opéré manuellement dans les régies).

export interface MediaPlannerInput {
  client: Client
  channel: CampaignChannel
  objective: string
  budgetEur: number
  brief: string
  durationDays: number
}

export interface MediaPlannerOutput {
  plan: MediaPlan
  cost: number
  tokensUsed: number
  model: string
}

export async function runMediaPlanner(input: MediaPlannerInput): Promise<MediaPlannerOutput> {
  const { client, channel, budgetEur, brief, durationDays } = input
  const apiKey = process.env.ANTHROPIC_API_KEY
  const playbook = getPlaybookForClient(client)

  if (!apiKey) {
    return { plan: fallbackPlan(input), cost: 0, tokensUsed: 0, model: 'fallback' }
  }

  const objectiveLabel = BUSINESS_OBJECTIVES[input.objective as keyof typeof BUSINESS_OBJECTIVES]?.label ?? input.objective

  const systemPrompt = channel === 'meta_ads'
    ? `Tu es **Media Planner**, expert senior en publicité Meta (Facebook + Instagram Ads) pour commerces locaux et PME, 10 ans d'expérience en agence.
Contexte métier prioritaire : ${playbook.promptContext}

## Règles Meta Ads
- Le texte principal doit accrocher dans les 2 premières lignes (avant le "voir plus").
- Headline : ${META_LIMITS.headline} caractères MAX. Description : ${META_LIMITS.description} caractères MAX. Texte principal : ~${META_LIMITS.primaryText} caractères.
- 3 variantes avec des angles RÉELLEMENT différents (ex: preuve sociale / offre concrète / problème→solution). Pas trois reformulations du même message.
- Le CTA doit correspondre à l'objectif (devis → "Demander un devis", réservation → "Réserver").
- Cibler local et concret : pas d'audience "18-65 France entière" pour un commerce de proximité.
- Budget : recommander une répartition réaliste (prospection/retargeting) et un rythme quotidien cohérent avec le budget total.

Réponds en français, en JSON strict, sans markdown.`
    : `Tu es **Media Planner**, expert senior en Google Ads (Search) pour commerces locaux et PME, 10 ans d'expérience en agence.
Contexte métier prioritaire : ${playbook.promptContext}

## Règles Google Ads (Responsive Search Ads)
- Headlines : 12 à 15 titres, ${GOOGLE_LIMITS.headline} caractères MAX CHACUN — c'est une limite STRICTE de la régie, un titre trop long est rejeté.
- Descriptions : 4 descriptions, ${GOOGLE_LIMITS.description} caractères MAX CHACUNE.
- Varier les titres : bénéfice, preuve, offre, localisation, marque, CTA.
- Mots-clés : 15-25, en intention commerciale ("achat", "devis", "prix", "près de moi", métier + ville). PAS de génériques trop larges.
- Negative keywords : exclure le hors-cible évident (gratuit, emploi, formation, DIY…).
- Budget : recommander un CPC estimé prudent et le nombre de clics/jour réaliste.

Réponds en français, en JSON strict, sans markdown.`

  const responseFormat = channel === 'meta_ads'
    ? `{
  "audience": "Ciblage recommandé en langage clair (zone, âge, intérêts, exclusions)",
  "budgetSplit": "Répartition du budget et rythme quotidien",
  "duration": "Durée et phasage recommandés",
  "landingAdvice": "Où envoyer le clic et quoi vérifier sur la page",
  "metaCreatives": [
    { "angle": "...", "primaryText": "...", "headline": "...", "description": "...", "cta": "...", "visualBrief": "..." },
    { "angle": "...", "primaryText": "...", "headline": "...", "description": "...", "cta": "...", "visualBrief": "..." },
    { "angle": "...", "primaryText": "...", "headline": "...", "description": "...", "cta": "...", "visualBrief": "..." }
  ],
  "kpisToWatch": ["KPI 1", "KPI 2"]
}`
    : `{
  "audience": "Zone géographique + calendrier de diffusion recommandés",
  "budgetSplit": "Budget quotidien, CPC estimé, clics/jour attendus",
  "duration": "Durée et phasage recommandés",
  "landingAdvice": "Où envoyer le clic et quoi vérifier sur la page",
  "googleCreative": {
    "headlines": ["12-15 titres de 30 caractères max"],
    "descriptions": ["4 descriptions de 90 caractères max"],
    "keywords": ["15-25 mots-clés commerciaux"],
    "negativeKeywords": ["mots-clés à exclure"]
  },
  "kpisToWatch": ["KPI 1", "KPI 2"]
}`

  const userPrompt = `# CLIENT

**Nom :** ${client.name}
**Type d'activité :** ${playbook.label}
**Ville :** ${client.city || 'non renseignée'}
**Description :** ${client.description || 'non renseignée'}
**Résumé :** ${client.clientSummary || 'non renseigné'}
**Ton de marque :** ${client.brandVoiceTone || 'non renseigné'}
**À éviter :** ${client.brandVoiceAvoid || 'rien de particulier'}

${client.businessProfile ? `# PROFIL BUSINESS

**Offres principales :** ${client.businessProfile.mainOffers.join(', ') || 'non renseignées'}
**Panier moyen :** ${client.businessProfile.avgBasketEur ? `${client.businessProfile.avgBasketEur} €` : 'non renseigné'}
**Canaux de conversion :** ${client.businessProfile.conversionChannels.map(c => CONVERSION_CHANNELS[c]?.label ?? c).join(', ')}
${client.businessProfile.localCompetitors.length ? `**Concurrents locaux :** ${client.businessProfile.localCompetitors.join(', ')}` : ''}
${client.businessProfile.seasonality ? `**Saisonnalité :** ${client.businessProfile.seasonality}` : ''}
` : ''}

# CAMPAGNE À PLANIFIER

**Canal :** ${channel === 'meta_ads' ? 'Meta Ads (Facebook + Instagram)' : 'Google Ads (Search)'}
**Objectif :** ${objectiveLabel}
**Budget total :** ${budgetEur} €
**Durée :** ${durationDays} jours
**Brief de l'agence :** ${brief || 'Aucun brief — proposer le meilleur angle pour cet objectif.'}

# TÂCHE

Produis le plan média complet. Réponds en JSON strict, sans backticks, exactement ce format :

${responseFormat}`

  try {
    const claude = new Anthropic({ apiKey })
    const message = await claude.messages.create({
      model: AGENT_MODELS.opus,
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high' },
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const textBlock = message.content.find(b => b.type === 'text')
    const rawText = textBlock && textBlock.type === 'text' ? textBlock.text : ''
    const parsed = parsePlan(rawText)
    const plan = normalizePlan(parsed, channel, input)

    const inputTokens = message.usage.input_tokens
    const outputTokens = message.usage.output_tokens

    return {
      plan,
      cost: calcCost('opus', inputTokens, outputTokens),
      tokensUsed: inputTokens + outputTokens,
      model: AGENT_MODELS.opus,
    }
  } catch {
    return { plan: fallbackPlan(input), cost: 0, tokensUsed: 0, model: 'fallback' }
  }
}

function parsePlan(rawText: string): Partial<MediaPlan> {
  try {
    const cleanText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
    return JSON.parse(cleanText) as Partial<MediaPlan>
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Réponse non parsable comme JSON')
    return JSON.parse(match[0]) as Partial<MediaPlan>
  }
}

/** Coupe proprement au dernier espace avant la limite (les régies rejettent les dépassements). */
function clamp(text: string, max: number): string {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  const cut = trimmed.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()
}

function normalizeMetaCreative(raw: Partial<MetaAdCreative>): MetaAdCreative {
  return {
    angle: (raw.angle || 'Angle principal').trim(),
    primaryText: clamp(raw.primaryText || '', META_LIMITS.primaryText + 100),
    headline: clamp(raw.headline || '', META_LIMITS.headline),
    description: clamp(raw.description || '', META_LIMITS.description),
    cta: (raw.cta || 'En savoir plus').trim(),
    visualBrief: (raw.visualBrief || '').trim(),
  }
}

function normalizeGoogleCreative(raw: Partial<GoogleAdCreative> | undefined): GoogleAdCreative {
  return {
    headlines: (raw?.headlines ?? []).map(h => clamp(h, GOOGLE_LIMITS.headline)).filter(Boolean).slice(0, 15),
    descriptions: (raw?.descriptions ?? []).map(d => clamp(d, GOOGLE_LIMITS.description)).filter(Boolean).slice(0, 4),
    keywords: (raw?.keywords ?? []).map(k => k.trim()).filter(Boolean).slice(0, 25),
    negativeKeywords: (raw?.negativeKeywords ?? []).map(k => k.trim()).filter(Boolean).slice(0, 25),
  }
}

function normalizePlan(parsed: Partial<MediaPlan>, channel: CampaignChannel, input: MediaPlannerInput): MediaPlan {
  const fallback = fallbackPlan(input)
  const base: MediaPlan = {
    audience: parsed.audience?.trim() || fallback.audience,
    budgetSplit: parsed.budgetSplit?.trim() || fallback.budgetSplit,
    duration: parsed.duration?.trim() || fallback.duration,
    landingAdvice: parsed.landingAdvice?.trim() || fallback.landingAdvice,
    kpisToWatch: Array.isArray(parsed.kpisToWatch) && parsed.kpisToWatch.length
      ? parsed.kpisToWatch.slice(0, 8)
      : fallback.kpisToWatch,
  }

  if (channel === 'meta_ads') {
    const creatives = Array.isArray(parsed.metaCreatives) ? parsed.metaCreatives : []
    base.metaCreatives = creatives.slice(0, 3).map(normalizeMetaCreative)
    if (base.metaCreatives.length === 0) base.metaCreatives = fallback.metaCreatives
  } else {
    base.googleCreative = normalizeGoogleCreative(parsed.googleCreative)
    if (base.googleCreative.headlines.length === 0) base.googleCreative = fallback.googleCreative
  }

  return base
}

/** Plan minimal si la clé API est absente ou l'appel échoue — l'agence peut le compléter à la main. */
function fallbackPlan(input: MediaPlannerInput): MediaPlan {
  const playbook = getPlaybookForClient(input.client)
  const city = input.client.city || 'votre zone'
  const daily = input.durationDays > 0 ? (input.budgetEur / input.durationDays).toFixed(0) : '—'

  const base: MediaPlan = {
    audience: `Zone locale autour de ${city} (10-25 km selon densité). Affiner par centres d'intérêt liés à : ${playbook.label}.`,
    budgetSplit: `${input.budgetEur} € sur ${input.durationDays} jours (~${daily} €/jour). Répartition suggérée : 70 % prospection / 30 % retargeting.`,
    duration: `${input.durationDays} jours, avec un point d'optimisation à mi-parcours.`,
    landingAdvice: 'Envoyer vers la page la plus proche de la conversion (formulaire de contact, réservation). Vérifier : chargement mobile < 3 s, CTA visible sans scroller.',
    kpisToWatch: playbook.kpis.slice(0, 5),
  }

  if (input.channel === 'meta_ads') {
    base.metaCreatives = [{
      angle: 'À compléter — génération IA indisponible',
      primaryText: input.brief || `Découvrez ${input.client.name} à ${city}.`,
      headline: clamp(input.client.name, META_LIMITS.headline),
      description: clamp(playbook.label, META_LIMITS.description),
      cta: 'En savoir plus',
      visualBrief: 'Visuel authentique du commerce (pas de stock photo).',
    }]
  } else {
    base.googleCreative = {
      headlines: [clamp(input.client.name, GOOGLE_LIMITS.headline), clamp(`${playbook.label} ${city}`, GOOGLE_LIMITS.headline)],
      descriptions: [clamp(input.brief || `${playbook.label} à ${city} — contactez-nous.`, GOOGLE_LIMITS.description)],
      keywords: [`${playbook.label.toLowerCase()} ${city.toLowerCase()}`],
      negativeKeywords: ['gratuit', 'emploi', 'formation'],
    }
  }

  return base
}
