import Anthropic from '@anthropic-ai/sdk'
import type { Client } from '@/types/client'
import type { VisualIdentity } from '@/types/asset'
import type { Post } from '@/types/post'
import { getVisualIdentity } from '@/lib/db/queries/assets'
import { buildExpertSystemPrompt } from '@/lib/agents/prompts'
import { AGENT_MODELS, calcCost } from '@/lib/agents/config'
import { getPlaybook } from '@/lib/playbooks'

export type Platform = 'instagram' | 'facebook' | 'tiktok' | 'linkedin'

function engRate(post: Post): number {
  if (!post.metaInsights?.length) return 0
  const total = post.metaInsights.reduce((sum, i) => {
    const reach = i.reach ?? 0
    if (reach === 0) return sum
    return sum + ((i.likes ?? 0) + (i.comments ?? 0) + (i.shares ?? 0)) / reach * 100
  }, 0)
  return parseFloat((total / post.metaInsights.length).toFixed(2))
}

interface GenerateCaptionInput {
  client: Client
  brief: string
  platforms: Platform[]
  contentType?: 'photo' | 'reel' | 'story'
  topPosts?: Post[]
}

export interface GeneratedCaption {
  platform: Platform
  caption: string
  hashtags: string[]
  hook: string
  hookVariants: string[]
  cta: string
  characterCount: number
  suggestedFormat: 'post' | 'carousel' | 'reel'
  formatRationale?: string
}

export interface SocialExpertResult {
  captions: GeneratedCaption[]
  reasoning: string
  cost: number
  tokensUsed: number
  model: string
}

// ─── Platform-specific guidelines ──────────────────────────────────────────────

const PLATFORM_GUIDELINES: Record<Platform, string> = {
  instagram: `
INSTAGRAM (caption + hashtags):
- Longueur : 125-200 caractères pour la partie visible avant "...plus"
- Hook puissant dans les 2 premières lignes (engagement = nombre de "voir plus")
- Emojis : 3-8 (équilibrés, pas excessifs)
- Hashtags : 5-8 hashtags mixant branded + local + thématique (mettre en bas)
- CTA naturel : "Réservez", "Découvrez", "Commentez avec votre plat préféré", etc.
- Tag de localisation suggéré`,

  facebook: `
FACEBOOK (caption plus longue) :
- Longueur : 200-400 caractères (audience plus mature)
- Ton plus narratif, storytelling
- Moins d'emojis (1-3 maximum)
- Pas de hashtags (ou 1-2 maximum)
- Lien direct fréquent (réservation, menu, etc.)
- CTA : "En savoir plus", "Réservez maintenant", "Partagez avec vos amis"`,

  tiktok: `
TIKTOK (très court, viral) :
- Longueur : 80-150 caractères maximum
- Hook ultra-fort première ligne
- Style très direct, parfois provocateur ou intrigant
- Emojis : 2-4 expressifs
- Hashtags : 3-5 mixant viral (#fyp #pourtoi) + niche
- CTA implicite (curiosité, complétion)`,

  linkedin: `
LINKEDIN (professionnel) :
- Longueur : 150-300 caractères
- Ton professionnel mais humain
- Storytelling business possible
- Emojis : 0-2 minimum
- Hashtags : 3-5 professionnels en bas
- CTA : engagement réflexion ou networking`,
}

// ─── Main agent function ──────────────────────────────────────────────────────

export async function generateCaption(input: GenerateCaptionInput): Promise<SocialExpertResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY non configurée')

  const { client, brief, platforms, contentType = 'photo', topPosts = [] } = input

  // Build platform-specific guidelines
  const platformInstructions = platforms.map(p => PLATFORM_GUIDELINES[p]).join('\n\n')

  // Load visual identity if available (enriches the brand context)
  const identity = await getVisualIdentity(client.id)
  const identityBlock = buildIdentityBlock(identity)

  // Load vertical playbook for specialized expertise
  const playbook = getPlaybook(client.businessProfile?.vertical ?? client.type)

  // Master prompt with full client context
  const systemPrompt = buildExpertSystemPrompt('social-expert', `Tu es **Social Expert**, directeur de création contenu pour commerces physiques avec 10 ans d'expérience terrain.
Tu as géré les comptes Instagram et Facebook de plus de 80 établissements en France : restaurants, hôtels, bars, coiffeurs, salles de sport, clubs de padel, boutiques.

## Ce que tu sais par cœur

### Timing optimal par type d'établissement
- Restaurant midi : publie 10h30–11h30 (décision repas en cours, reach +40%)
- Restaurant soir : publie 17h–18h30 (avant la décision dîner, engagement peak)
- Bar / cocktail : publie jeudi 16h–18h et vendredi 11h (drive weekend traffic)
- Hôtel / B&B : publie mardi–mercredi (réservations week-end se décident en milieu de semaine)
- Brunch : publie vendredi 18h (planning week-end en cours de construction)

### Hiérarchie visuelle HORECA (du plus performant au moins)
1. Close-up texture (fondu, croustillant, vapeur, couleur) → Instagram saves ×3
2. Mise en situation humaine (main, convives, lumière ambiante) → partages ×2
3. Hero shot vue du dessus — reconnaissance de marque
4. Behind-the-scenes (chef, cuisine en action) → authenticité, commentaires ×4

### Règles caption Instagram (algorithme 2024-2026)
- Hook : première ligne = déclencheur sensoriel ou question rhétorique. PAS le nom du plat seul.
- Structure : paragraphe dense (3-4 lignes) → saut de ligne → émojis → saut de ligne → hashtags
- Longueur optimale : 120-300 caractères pour le texte principal (avant "voir plus")
- Carousels 4-8 slides surpassent les posts seuls (saved → boosté par l'algo)
- 5-8 hashtags max : 2 locaux + 2 niche type + 2 concept + 1 brand
- JAMAIS #food #yummy #photooftheday (saturés, pénalisent la portée)
- 2-3 émojis dans la caption = +15% engagement. Plus = perçu comme spam.

### Règles caption Facebook (audience 35-60 ans, France)
- Captions plus longues acceptées (150-250 mots si contenu riche)
- Question ouverte en fin de caption = commentaires ×3
- "Taggez un ami qui aimerait..." = partages ×5
- PAS de hashtags sur Facebook (baisse la portée organique)
- Photos >> vidéos algorithmiquement pour restaurants (2024-2026)
- Numéro de téléphone dans le post = conversions directes (audience préfère appeler)

### CTAs qui convertissent réellement (testés sur des dizaines de comptes)
- Instagram : "Réservez votre table 👉 lien en bio" (surpasse "Réservez maintenant" de 50%)
- Facebook : "Appelez le XX.XX.XX.XX pour réserver" (senior audience)
- Bar/B&B : "Envoyez-nous un DM pour disponibilités" (direct conversion)
- Urgence vraie : "Dernières tables disponibles ce samedi soir" (scarcité réelle uniquement)

### Clichés à bannir absolument (sur-utilisés, font fuir les abonnés)
- "fait maison" → remplacer par "préparé par [prénom du chef]" ou "recette de la maison depuis [année]"
- "frais du jour" → nommer la provenance : "tomates de Laurent, maraîcher à [ville]"
- "venez nombreux" → CTA vague, inutile
- "notre équipe vous accueille chaleureusement" → platitude d'entreprise
- "nous vous proposons" → supprimé, commence directement avec le produit
- "n'hésitez pas à..." → formulation molle, à supprimer

### Vocabulaire sensoriel haute performance pour HORECA
Utiliser au moins UN mot sensoriel dans le hook :
fondant · croustillant · fumé · doré · généreux · délicat · onctueux · parfumé ·
velouté · croquant · juteux · caramélisé · frémissant · enveloppant · intense

### Déclencheurs psychologiques qui fonctionnent
- Scarcité : "Dernières tables ce vendredi" (uniquement si vrai)
- Origine : "Agneau de Sisteron, élevé en plein air" (provenance = premium perçu)
- Coulisses : "Notre chef arrive à 5h du matin pour..." (authenticité = engagement)
- Social proof : reprendre un vrai avis Google/TripAdvisor en citation
- Saisonnalité : ancrer dans le moment présent (première terrasse, premier feu de cheminée)

### Saisonnalité HORECA France (hooks à exploiter au bon moment)
- Jan : "Après les fêtes, on repart léger..." / Galette des rois
- Fév : Saint-Valentin (préparer 2 semaines avant) / Mardi Gras
- Mar–Avr : terrasse, Pâques, premiers légumes primeurs
- Mai–Juin : Fête des Pères, début été, rosé en terrasse
- Juil–Août : chaleur → légèreté, mocktails, sorbet, plats froids
- Sep : rentrée, plats mijotés, retour des clients fidèles
- Oct–Nov : champignons, châtaignes, premiers feux, Beaujolais nouveau
- Déc : menus de Noël dès le 1er nov, réveillons, cadeaux gastronomiques

### Format de contenu à recommander
- **post** : sujet focal unique (un plat, un moment, un portrait, une ambiance)
- **carousel** : brief implique une liste, une progression, un avant/après, un multi-produits (4-8 slides)
- **reel** : brief implique du mouvement, une action visible, une recette en étapes, une ambiance sonore
Toujours renseigner suggestedFormat et justifier en 1 phrase dans formatRationale.

## Expertise spécifique pour ce secteur d'activité

${playbook.promptContext}

## Ce que tu ne fais jamais
- Promettre sans preuve ("le meilleur de la ville") → risque légal + perte de crédibilité
- Révéler les prix dans le post → baisse la portée Meta de 30% (Meta veut les pubs payantes)
- Ignorer la brand voice client → même si le prompt générique serait meilleur
- Générer des hashtags inventés qui n'existent pas vraiment
- Écrire en majuscules pour "crier" — c'est 2015

Réponds en français, en JSON strict, sans markdown.`)

  const userPrompt = `# CONTEXTE CLIENT

**Établissement :** ${client.name}
**Type :** ${client.type}
**Ville :** ${client.city || 'non renseignée'}
**Description :** ${client.description || 'non renseignée'}
**Langues :** ${client.languages.join(', ')}

# VOIX DE MARQUE

**Ton :** ${client.brandVoiceTone || 'à déterminer (style conversationnel)'}
**Mots-clés à utiliser :** ${client.brandVoiceKeywords || 'libre'}
**À éviter :** ${client.brandVoiceAvoid || 'rien de particulier'}
${identityBlock}
# BRIEF DU POST

${brief}

**Type de contenu :** ${contentType}

${topPosts.length > 0 ? `# RÉFÉRENCES — TOP POSTS DE CE CLIENT

Ces captions ont généré le meilleur engagement réel pour ${client.name}.
Inspire-toi du style, du ton, de la structure du hook et du CTA. Ne copie pas — adapte.

${topPosts.map((p, i) => {
    const rate = engRate(p)
    return `--- Référence ${i + 1} (${rate}% engagement) ---
${p.caption}
Hook utilisé : ${p.hook || '—'}
CTA : ${p.cta || '—'}
Hashtags : ${p.hashtags.slice(0, 5).join(' ')}`
  }).join('\n\n')}

` : ''}# PLATEFORMES CIBLES

${platforms.map(p => `- ${p}`).join('\n')}

# GUIDELINES PAR PLATEFORME

${platformInstructions}

# TÂCHE

Génère une version optimisée pour chaque plateforme demandée.

**Réponds en JSON strict, sans backticks, sans markdown, exactement ce format :**

{
  "reasoning": "Bref raisonnement (1-2 phrases) sur l'angle stratégique choisi pour ce post",
  "captions": [
    {
      "platform": "instagram",
      "caption": "Le texte complet à publier (sans les hashtags)",
      "hashtags": ["hashtag1", "hashtag2", "..."],
      "hook": "Le hook principal retenu — le plus fort",
      "hookVariants": [
        "Variante A — ton plus direct ou plus sensoriel",
        "Variante B — ton plus émotionnel ou narratif"
      ],
      "cta": "Le call-to-action utilisé",
      "suggestedFormat": "post",
      "formatRationale": "Post simple — un seul sujet focal, pas de liste ou de progression."
    }
  ]
}`

  const claude = new Anthropic({ apiKey })

  const message = await claude.messages.create({
    model: AGENT_MODELS.opus,
    max_tokens: 4096, // headroom for adaptive thinking + JSON output
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high' },
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  // Find the first text block (thinking blocks may precede text)
  const textBlock = message.content.find(b => b.type === 'text')
  const rawText = textBlock && textBlock.type === 'text' ? textBlock.text : ''

  // Robust JSON extraction
  let parsed: { reasoning: string; captions: Omit<GeneratedCaption, 'characterCount'>[] }
  try {
    // Strip markdown code fences if present
    const cleanText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
    parsed = JSON.parse(cleanText)
  } catch {
    // Try to extract JSON object from text
    const match = rawText.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Réponse non parsable comme JSON')
    parsed = JSON.parse(match[0])
  }

  const VALID_FORMATS = ['post', 'carousel', 'reel'] as const
  const captionsWithCount: GeneratedCaption[] = parsed.captions.map(c => ({
    ...c,
    hookVariants: Array.isArray(c.hookVariants) ? c.hookVariants.slice(0, 2) : [],
    suggestedFormat: VALID_FORMATS.includes(c.suggestedFormat as typeof VALID_FORMATS[number])
      ? (c.suggestedFormat as typeof VALID_FORMATS[number])
      : 'post',
    formatRationale: typeof c.formatRationale === 'string' ? c.formatRationale : undefined,
    characterCount: c.caption.length,
  }))

  const inputTokens = message.usage.input_tokens
  const outputTokens = message.usage.output_tokens
  const cost = calcCost('opus', inputTokens, outputTokens)

  return {
    captions: captionsWithCount,
    reasoning: parsed.reasoning,
    cost,
    tokensUsed: inputTokens + outputTokens,
    model: AGENT_MODELS.opus,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildIdentityBlock(identity: VisualIdentity | null): string {
  if (!identity || !identity.stylePrompt) return ''

  return `
# IDENTITÉ VISUELLE DU CLIENT (DA détectée par CODEXRS)

**Mood global :** ${identity.overallMood}
**Lumière :** ${identity.lightingStyle}
**Composition :** ${identity.compositionPref}
**Mots-clés style :** ${identity.styleKeywords.join(', ')}
**À éviter visuellement :** ${identity.avoidKeywords.join(', ')}

**Synthèse :** ${identity.visualSummary}

⚠️ Le ton, les mots-clés et le vocabulaire des captions doivent rester COHÉRENTS avec cette identité visuelle.
`
}
