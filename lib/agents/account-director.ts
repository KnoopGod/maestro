import Anthropic from '@anthropic-ai/sdk'
import type { Client } from '@/types/client'
import type { Post } from '@/types/post'
import { getVisualIdentity } from '@/lib/db/queries/assets'
import { listPosts } from '@/lib/db/queries/posts'

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
}): Promise<{
  directive: AccountDirective
  cost: number
  tokensUsed: number
  model: string
}> {
  const { client, userBrief } = input
  const topPosts = input.topPosts ?? []
  const recentPosts = input.recentPosts ?? await listPosts({ clientId: client.id, limit: 10 })
  const fallback = fallbackDirective(client, userBrief, recentPosts)
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return { directive: fallback, cost: 0, tokensUsed: 0, model: 'fallback' }
  }

  const identity = await getVisualIdentity(client.id)
  const systemPrompt = `Tu es **Account Director CODEXRS**, chef de dossier client pour une agence HORECA.

Ton rôle : avant la rédaction d'un post, lire la stratégie client, l'historique récent et la direction artistique, puis choisir le prochain angle utile.

Principes :
1. Prioriser un pilier stratégique pas encore trop couvert.
2. Si un brief utilisateur existe, l'enrichir sans le remplacer.
3. Donner un brief exploitable directement par Social Expert et Visual Director.
4. Éviter les redites, les promesses floues et le ton générique.

Réponds en français, en JSON strict, sans markdown.`

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
**Piliers de contenu :** ${client.strategy.contentPillars.join(', ') || 'non renseignés'}
**Fréquence :** ${client.strategy.frequency}
**À éviter stratégiquement :** ${client.strategy.avoid.join(', ') || 'non renseigné'}

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
      model: 'claude-opus-4-7',
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
    const cost = (inputTokens * 5 + outputTokens * 25) / 1_000_000

    return {
      directive: normalizeDirective(parsed, fallback, client.strategy.contentPillars),
      cost: parseFloat(cost.toFixed(6)),
      tokensUsed: inputTokens + outputTokens,
      model: 'claude-opus-4-7',
    }
  } catch {
    return { directive: fallback, cost: 0, tokensUsed: 0, model: 'fallback' }
  }
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
