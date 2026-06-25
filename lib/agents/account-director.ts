import Anthropic from '@anthropic-ai/sdk'
import type { Client } from '@/types/client'
import { BUSINESS_OBJECTIVES, CONVERSION_CHANNELS, BUSINESS_TARGET_DELAYS } from '@/types/client'
import type { Post } from '@/types/post'
import { getVisualIdentity } from '@/lib/db/queries/assets'
import { listPosts } from '@/lib/db/queries/posts'
import { buildExpertSystemPrompt } from '@/lib/agents/prompts'
import { getPlaybook } from '@/lib/playbooks'
import { AGENT_MODELS, calcCost } from '@/lib/agents/config'

export interface AccountDirective {
  /** Pilier prioritaire à traiter ensuite (issu de client.strategy.contentPillars). */
  priorityPillar: string
  /** Rationale en 1 phrase expliquant pourquoi ce pilier maintenant. */
  rationale: string
  /** Brief enrichi : 2-4 phrases prêtes pour Social Expert. */
  enrichedBrief: string
  /** Idée de hook en 1 phrase courte. */
  hookSuggestion: string
  /** Verbe CTA suggéré, par exemple "Réservez" ou "Découvrez". */
  ctaSuggestion: string
  /** Piliers déjà couverts par les posts récents pour éviter la répétition. */
  recentPillarsCovered: string[]
}

function engRate(post: Post): number {
  if (!post.metaInsights?.length) return 0
  const total = post.metaInsights.reduce((sum, i) => {
    const reach = i.reach ?? 0
    if (reach === 0) return sum
    return sum + ((i.likes ?? 0) + (i.comments ?? 0) + (i.shares ?? 0)) / reach * 100
  }, 0)
  return parseFloat((total / post.metaInsights.length).toFixed(2))
}

export async function runAccountDirector(input: {
  client: Client
  /** Brief utilisateur optionnel : Account Director l'enrichit sans le remplacer. */
  userBrief?: string
  /** Posts récents optionnels pour détecter les répétitions. Si absent, l'agent charge les 10 derniers. */
  recentPosts?: Post[]
  /** Top performers (par engagement) pour le learning loop. */
  topPosts?: Post[]
  /** ISO datetime du run, ex. "2026-06-09T14:23:00Z". Injecte le contexte temporel dans le prompt. */
  runAt?: string
}): Promise<{
  directive: AccountDirective
  cost: number
  tokensUsed: number
  model: string
}> {
  const { client, userBrief } = input
  const topPosts = input.topPosts ?? []
  // includeInsights reste actif : le learning loop lit metaInsights des posts récents
  const recentPosts = input.recentPosts ?? await listPosts({ clientId: client.id, limit: 10 })

  const now = input.runAt ? new Date(input.runAt) : new Date()
  const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
  const MONTH_NAMES = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                       'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  const dayOfWeek = DAY_NAMES[now.getDay()]
  const monthName = MONTH_NAMES[now.getMonth()]
  const dayOfMonth = now.getDate()
  const temporalSignals = getTemporalSignals(now.getDay(), now.getMonth(), dayOfMonth)
  const fallback = fallbackDirective(client, userBrief, recentPosts)
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return { directive: fallback, cost: 0, tokensUsed: 0, model: 'fallback' }
  }

  const identity = await getVisualIdentity(client.id)
  const systemPrompt = buildExpertSystemPrompt('account-director', `Tu es **Account Director**, chef de dossier senior pour une agence HORECA avec 10 ans d'expérience.
Tu as géré des portefeuilles de 20-30 établissements simultanément. Tu connais les piliers de contenu qui fonctionnent par type d'établissement, les saisons HORECA, les erreurs de répétition qui fatiguent les abonnés.

## Ton rôle précis
Avant chaque post, tu lis la stratégie du client, l'historique récent, et la DA disponible.
Tu choisis le pilier le plus pertinent MAINTENANT (pas celui qu'on a déjà fait cette semaine).
Tu enrichis le brief utilisateur sans l'écraser — tu ajoutes l'angle stratégique, le hook, le CTA suggéré.

## Ce que tu sais par type d'établissement

### Restaurant
Piliers qui alternent bien : Plat signature → Coulisses → Menu du jour → Avis client → Réservation événement → Origine produit → L'équipe
Piliers à espacer (max 1x/semaine) : Menu du jour, promotion
Piliers à alterner toujours : au moins 1 humain/coulisses pour 2 posts produits

### Hôtel
Piliers : Chambre lifestyle (avec personnes, pas vide) → Vue / environnement → Activités locales → Petit-déjeuner → Expérience client → Événement / saison
Le piège hôtel : trop de photos de chambres vides. Toujours préférer une chambre avec ambiance (plateau petit-déj, valise ouverte, couple en arrière-plan flou).

### Bar / Cocktail
Piliers : Cocktail signature → Happy hour → Behind the bar → Ambiance soirée → Cocktail du mois → Accord mets-cocktail
Timing critique : jeudi-vendredi pour générer du trafic week-end. Lundi-mardi = contenu engagement (devinettes, photos artisanales, coulisses).

### Chambre d'hôtes / B&B
Piliers : Vue / cadre naturel → Petit-déjeuner fait maison → Activités locales → Chambre mise en scène → Témoignage client → Disponibilités (directement convertisseur)
Le B&B doit créer du rêve d'abord, de la réservation directe ensuite. Ne jamais commencer par le prix.

## Règles d'alternance
1. Jamais 2 posts "produit" de suite sans post "humain/coulisses"
2. Jamais 2 promotions / CTAs commerciaux de suite
3. Si les 3 derniers posts couvrent le même pilier → changer absolument
4. Après un post très performant (si insight disponible) → analyser l'angle et le reproduire avec variation

## Ce que tu livres au Social Expert
Un brief enrichi en 2-4 phrases, prêt à copier-coller. Pas d'instructions méta ("tu devrais..."), des formulations directes.
Exemple de bon enrichedBrief : "Le tartare de bœuf du chef Marco, préparé devant le client avec huile de truffe noire du Périgord et câpres de Pantelleria. Mettre en avant le geste du chef et l'ingrédient d'exception. CTA : réserver pour ce soir, X couverts restants."
Exemple de mauvais enrichedBrief : "Parler du tartare et mettre en avant la qualité."

Réponds en français, en JSON strict, sans markdown.`)

  const playbook = client.businessProfile?.vertical
    ? getPlaybook(client.businessProfile.vertical)
    : getPlaybook(client.type)

  const userPrompt = `# CLIENT

**Établissement :** ${client.name}
**Type :** ${client.type}
**Ville :** ${client.city || 'non renseignée'}
**Description :** ${client.description || 'non renseignée'}
**Résumé compris par l'outil :** ${client.clientSummary || 'non renseigné'}

# VOIX DE MARQUE

**Ton :** ${client.brandVoiceTone || 'non renseigné'}
**Mots-clés :** ${client.brandVoiceKeywords || 'libre'}
**À éviter :** ${client.brandVoiceAvoid || 'rien de particulier'}

# STRATÉGIE

**Objectif :** ${client.strategy.objective}
**Piliers de contenu :** ${client.strategy.contentPillars.join(', ') || 'non renseignés'}
**Fréquence :** ${client.strategy.frequency}
**À éviter stratégiquement :** ${client.strategy.avoid.join(', ') || 'non renseigné'}

${client.businessProfile ? `# PROFIL BUSINESS

**Objectif prioritaire :** ${BUSINESS_OBJECTIVES[client.businessProfile.priorityObjective]?.label ?? client.businessProfile.priorityObjective}
**Délai cible :** ${BUSINESS_TARGET_DELAYS[client.businessProfile.targetDelay]?.label ?? client.businessProfile.targetDelay}
**Offres principales :** ${client.businessProfile.mainOffers.length ? client.businessProfile.mainOffers.join(', ') : 'non renseignées'}
**Canaux de conversion :** ${client.businessProfile.conversionChannels.map(c => CONVERSION_CHANNELS[c]?.label ?? c).join(', ') || 'non renseignés'}
${client.businessProfile.offDays.length ? `**Jours creux à remplir :** ${client.businessProfile.offDays.join(', ')}` : ''}
${client.businessProfile.peakDays.length ? `**Jours de pointe :** ${client.businessProfile.peakDays.join(', ')}` : ''}
${client.businessProfile.seasonality ? `**Saisonnalité :** ${client.businessProfile.seasonality}` : ''}
${client.businessProfile.constraints.length ? `**Contraintes :** ${client.businessProfile.constraints.join(', ')}` : ''}

Le brief enrichi et le CTA doivent être directement orientés vers cet objectif et ces canaux de conversion.

# CONTEXTE VERTICAL

${playbook.promptContext}
` : ''}

# DIRECTION ARTISTIQUE

${identity ? [
    `**Mood :** ${identity.overallMood || 'non renseigné'}`,
    `**Lumière :** ${identity.lightingStyle || 'non renseignée'}`,
    `**Composition :** ${identity.compositionPref || 'non renseignée'}`,
    `**Mots-clés style :** ${identity.styleKeywords.join(', ') || 'non renseignés'}`,
    `**À éviter visuellement :** ${identity.avoidKeywords.join(', ') || 'non renseigné'}`,
    `**Synthèse :** ${identity.visualSummary || identity.stylePrompt || 'non renseignée'}`,
  ].join('\n') : 'Aucune DA analysée disponible.'}

# POSTS RÉCENTS (${recentPosts.length} derniers)

${recentPosts.length ? recentPosts.map((post, index) => {
    const pillar = guessPillar(post, client.strategy.contentPillars)
    const rate = engRate(post)
    const perf = rate > 0 ? ` | Engagement : ${rate}%` : ''
    const flag = rate >= 3 ? ' ★ SURPERFORMANT' : rate > 0 && rate < 1 ? ' ↓ faible' : ''
    return `${index + 1}. Brief : ${post.brief} | Pilier : ${pillar} | Hook : ${post.hook || '—'}${perf}${flag}`
  }).join('\n') : 'Aucun post récent.'}

${topPosts.length > 0 ? `# APPRENTISSAGE — CE QUI A MARCHÉ POUR CE CLIENT

Les posts suivants ont généré le meilleur engagement réel. Utilise ces patterns pour choisir le prochain angle.

${topPosts.map((p, i) => {
    const rate = engRate(p)
    const pillar = guessPillar(p, client.strategy.contentPillars)
    return `${i + 1}. Engagement ${rate}% · Pilier : ${pillar}
   Hook : ${p.hook || p.caption.slice(0, 80)}
   Brief : ${p.brief}`
  }).join('\n\n')}

Si un pattern est clair (ex : les coulisses surperforment systématiquement les plats seuls), intègre-le dans ton choix de pilier et ton enrichedBrief.
` : '# APPRENTISSAGE\n\nPas encore de données de performance disponibles — utiliser la stratégie de base.'}

# CONTEXTE TEMPOREL

**Jour :** ${dayOfWeek} ${dayOfMonth} ${monthName}
**Signaux à exploiter :**
${temporalSignals}

# BRIEF UTILISATEUR

${userBrief?.trim() || 'Aucun brief fourni : proposer un angle frais sur le pilier prioritaire.'}

# TÂCHE

Choisis le prochain pilier à traiter. Si le brief utilisateur existe, conserve son intention et enrichis-le avec le contexte client, le pilier prioritaire, la DA et un angle concret.

Réponds en JSON strict, sans backticks, sans markdown, exactement ce format :

{
  "priorityPillar": "Un des piliers de contenu",
  "rationale": "Pourquoi ce pilier maintenant, en 1 phrase.",
  "enrichedBrief": "Brief enrichi en 2-4 phrases.",
  "hookSuggestion": "Hook court en 1 phrase.",
  "ctaSuggestion": "Verbe CTA court",
  "recentPillarsCovered": ["Pilier déjà couvert"]
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
    const parsed = parseDirective(rawText)
    const inputTokens = message.usage.input_tokens
    const outputTokens = message.usage.output_tokens
    const cost = calcCost('opus', inputTokens, outputTokens)

    return {
      directive: normalizeDirective(parsed, fallback, client.strategy.contentPillars),
      cost,
      tokensUsed: inputTokens + outputTokens,
      model: AGENT_MODELS.opus,
    }
  } catch {
    return { directive: fallback, cost: 0, tokensUsed: 0, model: 'fallback' }
  }
}

function getTemporalSignals(dayIndex: number, month: number, dayOfMonth: number): string {
  const signals: string[] = []

  if (dayIndex === 4 || dayIndex === 5) {
    signals.push('FENÊTRE WEEK-END : priorité CTAs réservation, posts bar/cocktail, drive traffic')
  }
  if (dayIndex === 1 || dayIndex === 2) {
    signals.push('DÉBUT SEMAINE : contenu engagement prioritaire (coulisses, équipe, storytelling)')
  }
  if (dayIndex === 3) {
    signals.push('MILIEU SEMAINE : hôtels/B&B — les réservations week-end se décident maintenant')
  }

  if (month === 0 && dayOfMonth <= 15) {
    signals.push('Galette des rois / post-fêtes — contenu léger, retour au quotidien')
  }
  if ((month === 0 && dayOfMonth >= 25) || (month === 1 && dayOfMonth <= 10)) {
    signals.push('SAINT-VALENTIN en approche — préparer menus et offres couples dès maintenant')
  }
  if (month === 1 && dayOfMonth >= 11 && dayOfMonth <= 18) {
    signals.push('SAINT-VALENTIN cette semaine — urgence maximale, dernières places disponibles')
  }
  if (month === 2 || (month === 3 && dayOfMonth <= 15)) {
    signals.push('Printemps / terrasses — premier rosé, légumes primeurs, Pâques en approche')
  }
  if ((month === 3 && dayOfMonth >= 16) || month === 4) {
    signals.push('Mai / début été — Fête des Pères, terrasses, rosé, légèreté')
  }
  if (month === 5 || month === 6 || month === 7) {
    signals.push('Plein été — légèreté, mocktails, sorbets, plats froids, clientèle touristique')
  }
  if ((month === 7 && dayOfMonth >= 20) || month === 8) {
    signals.push('Rentrée — habitués de retour, plats mijotés, retour de saison')
  }
  if (month === 9) {
    signals.push('Automne — champignons, châtaignes, premiers feux de cheminée, Toussaint')
  }
  if (month === 10 && dayOfMonth <= 15) {
    signals.push('Beaujolais Nouveau bientôt (3ème jeudi) + NOËL : commencer les menus de réveillon')
  }
  if (month === 10 && dayOfMonth >= 16) {
    signals.push('NOËL EN APPROCHE : menus réveillons, cadeaux gastronomiques, dernières places')
  }
  if (month === 11) {
    signals.push('RÉVEILLON / FÊTES : urgence maximale, content de dernière minute, ambiance festive')
  }

  return signals.length > 0
    ? signals.map(s => `- ${s}`).join('\n')
    : "- Période standard — choisir le pilier selon l'alternance stratégique et l'historique récent."
}

function parseDirective(rawText: string): AccountDirective {
  try {
    const cleanText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
    return JSON.parse(cleanText) as AccountDirective
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Réponse non parsable comme JSON')
    return JSON.parse(match[0]) as AccountDirective
  }
}

function normalizeDirective(
  directive: Partial<AccountDirective>,
  fallback: AccountDirective,
  pillars: string[]
): AccountDirective {
  const priorityPillar = directive.priorityPillar && pillars.includes(directive.priorityPillar)
    ? directive.priorityPillar
    : fallback.priorityPillar

  return {
    priorityPillar,
    rationale: directive.rationale || fallback.rationale,
    enrichedBrief: directive.enrichedBrief || fallback.enrichedBrief,
    hookSuggestion: directive.hookSuggestion || fallback.hookSuggestion,
    ctaSuggestion: directive.ctaSuggestion || fallback.ctaSuggestion,
    recentPillarsCovered: Array.isArray(directive.recentPillarsCovered)
      ? directive.recentPillarsCovered.slice(0, 10)
      : fallback.recentPillarsCovered,
  }
}

function fallbackDirective(client: Client, userBrief: string | undefined, recentPosts: Post[]): AccountDirective {
  const pillars = client.strategy.contentPillars
  const recentPillarsCovered = Array.from(new Set(
    recentPosts
      .map(post => guessPillar(post, pillars))
      .filter(pillar => pillar !== 'Non identifié')
  ))
  const priorityPillar = pillars.find(pillar => !recentPillarsCovered.includes(pillar)) || pillars[0] || 'Priorité client'
  const briefBase = userBrief?.trim() || `${priorityPillar} — ${client.name}`
  const ctaSuggestion = ctaForClientType(client.type)

  return {
    priorityPillar,
    rationale: `Prioriser ${priorityPillar} permet de varier les angles récents tout en servant l'objectif client.`,
    enrichedBrief: userBrief?.trim()
      ? `${briefBase} Rattacher ce message au pilier "${priorityPillar}" et à l'objectif : ${client.strategy.objective}. Garder un ton ${client.brandVoiceTone || 'naturel'} avec un CTA clair.`
      : briefBase,
    hookSuggestion: `Et si ${client.name} devenait le bon réflexe cette semaine ?`,
    ctaSuggestion,
    recentPillarsCovered,
  }
}

function guessPillar(post: Post, pillars: string[]) {
  const source = `${post.brief} ${post.caption} ${post.hook || ''}`.toLowerCase()
  return pillars.find(pillar => source.includes(pillar.toLowerCase())) || 'Non identifié'
}

function ctaForClientType(type: Client['type']) {
  if (type === 'hotel' || type === 'bnb') return 'Réservez'
  if (type === 'bar') return 'Découvrez'
  return 'Réservez'
}
