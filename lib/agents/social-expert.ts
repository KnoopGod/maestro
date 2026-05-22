import Anthropic from '@anthropic-ai/sdk'
import type { Client } from '@/types/client'
import type { VisualIdentity } from '@/types/asset'
import { getVisualIdentity } from '@/lib/db/queries/assets'

export type Platform = 'instagram' | 'facebook' | 'tiktok' | 'linkedin'

interface GenerateCaptionInput {
  client: Client
  brief: string
  platforms: Platform[]
  contentType?: 'photo' | 'reel' | 'story'
}

interface GeneratedCaption {
  platform: Platform
  caption: string
  hashtags: string[]
  hook: string
  cta: string
  characterCount: number
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

  const { client, brief, platforms, contentType = 'photo' } = input

  // Build platform-specific guidelines
  const platformInstructions = platforms.map(p => PLATFORM_GUIDELINES[p]).join('\n\n')

  // Load visual identity if available (enriches the brand context)
  const identity = await getVisualIdentity(client.id)
  const identityBlock = buildIdentityBlock(identity)

  // Master prompt with full client context
  const systemPrompt = `Tu es **Social Expert**, l'agent IA spécialisé en création de contenu pour les établissements HORECA (restaurants, hôtels, bars, chambres d'hôte).

Tu génères des captions optimisées pour chaque plateforme, en respectant rigoureusement la voix de marque du client.

**Tes principes :**
1. Authenticité avant tout — pas de marketing creux
2. Adapter le ton à chaque plateforme (Instagram ≠ Facebook ≠ TikTok)
3. Hook puissant dans les 2 premières lignes
4. Hashtags pertinents et précis (pas génériques)
5. CTA naturel et non-intrusif
6. Respect strict de la brand voice (ton, mots-clés, mots à éviter)

**Format de sortie : JSON strict, sans markdown.**`

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

# PLATEFORMES CIBLES

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
      "hook": "La phrase d'accroche (1ère ligne)",
      "cta": "Le call-to-action utilisé"
    }
  ]
}`

  const claude = new Anthropic({ apiKey })

  // Opus 4.7 with adaptive thinking — best quality on brand voice matching.
  // Thinking content omitted by default (we don't surface it to users).
  const message = await claude.messages.create({
    model: 'claude-opus-4-7',
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

  const captionsWithCount: GeneratedCaption[] = parsed.captions.map(c => ({
    ...c,
    characterCount: c.caption.length,
  }))

  const inputTokens = message.usage.input_tokens
  const outputTokens = message.usage.output_tokens
  // Opus 4.7 pricing: $5/1M input, $25/1M output
  const cost = (inputTokens * 5 + outputTokens * 25) / 1_000_000

  return {
    captions: captionsWithCount,
    reasoning: parsed.reasoning,
    cost: parseFloat(cost.toFixed(6)),
    tokensUsed: inputTokens + outputTokens,
    model: 'claude-opus-4-7',
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildIdentityBlock(identity: VisualIdentity | null): string {
  if (!identity || !identity.stylePrompt) return ''

  return `
# IDENTITÉ VISUELLE DU CLIENT (DA détectée par Maestro)

**Mood global :** ${identity.overallMood}
**Lumière :** ${identity.lightingStyle}
**Composition :** ${identity.compositionPref}
**Mots-clés style :** ${identity.styleKeywords.join(', ')}
**À éviter visuellement :** ${identity.avoidKeywords.join(', ')}

**Synthèse :** ${identity.visualSummary}

⚠️ Le ton, les mots-clés et le vocabulaire des captions doivent rester COHÉRENTS avec cette identité visuelle.
`
}
