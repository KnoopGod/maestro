/**
 * Visual Identity Synthesizer
 *
 * Aggregates all the per-image vision analyses + document texts
 * into a single coherent visual identity card for the client.
 *
 * Output: a structured object including a `style_prompt` that can
 * be injected into image generation and caption writing prompts.
 */
import Anthropic from '@anthropic-ai/sdk'
import type { Client } from '@/types/client'
import type { ClientAsset } from '@/types/asset'
import { buildExpertSystemPrompt } from '@/lib/agents/prompts'

export interface IdentitySynthesisResult {
  palette: string[]
  lightingStyle: string
  overallMood: string
  compositionPref: string
  styleKeywords: string[]
  avoidKeywords: string[]
  stylePrompt: string
  visualSummary: string
  cost: number
  tokensUsed: number
}

export async function synthesizeVisualIdentity(
  client: Client,
  assets: ClientAsset[]
): Promise<IdentitySynthesisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY non configurée')

  // Build summaries from analyzed assets
  const analyzed = assets.filter(a => a.analyzedAt && a.aiDescription)

  const imageSummaries = analyzed
    .filter(a => a.type === 'image' || a.type === 'logo')
    .slice(0, 30)
    .map((a, i) => `[${i + 1}] ${a.category ?? 'general'} — ${a.aiDescription} | mood: ${a.mood} | colors: ${a.dominantColors.join(', ')} | tags: ${a.aiTags.join(', ')}`)
    .join('\n')

  // Documents (brand guides, briefs) — extract excerpts
  const documents = assets
    .filter(a => (a.type === 'document' || a.type === 'brand_guide') && a.extractedText)
    .slice(0, 5)
    .map((a, i) => `[DOC ${i + 1}] ${a.originalName}\n${(a.extractedText || '').slice(0, 2000)}`)
    .join('\n\n---\n\n')

  const claude = new Anthropic({ apiKey })

  const systemPrompt = buildExpertSystemPrompt('da-curator', `Tu es **Visual Identity Director**, l'agent de CODEXRS chargé de synthétiser l'identité visuelle d'un établissement HORECA en analysant ses contenus existants (photos, vidéos, documents).

Tu produis une carte d'identité visuelle qui guidera TOUTES les futures générations de contenu pour ce client (texte ET images).

**Tu dois être précis, opérationnel, pas générique.**

**Format de sortie : JSON strict, sans markdown.**`)

  const userPrompt = `# CLIENT

**Nom :** ${client.name}
**Type :** ${client.type}
**Ville :** ${client.city || '—'}
**Description :** ${client.description || '—'}
**Voix de marque actuelle :** ${client.brandVoiceTone || '—'}

# ANALYSE DES IMAGES (${imageSummaries.split('\n').filter(Boolean).length} analysées)

${imageSummaries || '(aucune image analysée pour l\'instant)'}

${documents ? `# DOCUMENTS / GUIDES DA\n\n${documents}\n` : ''}

# TÂCHE

Synthétise une identité visuelle cohérente. **Retourne EXACTEMENT ce JSON :**

{
  "palette": ["#RRGGBB", "#RRGGBB", "#RRGGBB", "#RRGGBB", "#RRGGBB"],
  "lightingStyle": "warm / cool / high_contrast / soft / mixed",
  "overallMood": "Un mood word concis (ex: cozy_rustic, elegant_modern, casual_bright)",
  "compositionPref": "close_up / ambient / mixed",
  "styleKeywords": ["mot1", "mot2", "mot3", "mot4", "mot5", "..."],
  "avoidKeywords": ["mot1", "mot2", "mot3"],
  "stylePrompt": "Un prompt complet en ANGLAIS de 2-4 phrases, prêt à être injecté dans une génération d'image (DALL-E, Flux, Firefly). Doit décrire précisément l'esthétique, la lumière, la palette, le mood, le style photographique.",
  "visualSummary": "Une synthèse en français de 2-3 phrases qui décrit l'identité visuelle du client de manière humaine et claire."
}

Règles strictes :
- palette : 4-6 couleurs dominantes basées sur les analyses (pas de couleurs random)
- styleKeywords : extraits des analyses, pas inventés
- stylePrompt : EN ANGLAIS (pour les modèles d'image), descriptif et photographique
- visualSummary : EN FRANÇAIS, ton humain
- Si peu de données, sois honnête mais cohérent

Réponds UNIQUEMENT le JSON.`

  // Opus 4.7 with adaptive thinking — DA synthesis benefits from deep reasoning
  // about cross-asset patterns. Thinking content omitted (we only use the JSON).
  const message = await claude.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 4096,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high' },
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  // Find the first text block (thinking blocks may precede text)
  const textBlock = message.content.find(b => b.type === 'text')
  const rawText = textBlock && textBlock.type === 'text' ? textBlock.text : ''

  let parsed: Omit<IdentitySynthesisResult, 'cost' | 'tokensUsed'>
  try {
    const cleanText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
    parsed = JSON.parse(cleanText)
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Réponse non parsable')
    parsed = JSON.parse(match[0])
  }

  const inputTokens = message.usage.input_tokens
  const outputTokens = message.usage.output_tokens
  // Opus 4.7 pricing: $5/1M input, $25/1M output
  const cost = (inputTokens * 5 + outputTokens * 25) / 1_000_000

  return {
    ...parsed,
    cost: parseFloat(cost.toFixed(6)),
    tokensUsed: inputTokens + outputTokens,
  }
}
