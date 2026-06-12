/**
 * Vision Analyzer Agent
 *
 * Analyzes a single image using Claude Vision and extracts:
 *  - Description (what's depicted)
 *  - Tags (subjects, objects, scenes)
 *  - Dominant colors (hex codes)
 *  - Mood (cozy, elegant, rustic, etc.)
 */
import Anthropic from '@anthropic-ai/sdk'
import { readFile } from 'node:fs/promises'
import { getAbsolutePath } from '@/lib/storage/extract-text'
import { buildExpertSystemPrompt } from '@/lib/agents/prompts'

export interface VisionAnalysis {
  description: string
  tags: string[]
  dominantColors: string[]
  mood: string
  cost: number
  tokensUsed: number
}

export async function analyzeImage(
  imageUrl: string,
  mimeType: string
): Promise<VisionAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY non configurée')

  // Read file from disk and convert to base64
  const filepath = getAbsolutePath(imageUrl)
  const buffer = await readFile(filepath)
  const base64 = buffer.toString('base64')

  const claude = new Anthropic({ apiKey })

  const systemPrompt = buildExpertSystemPrompt('vision-analyzer', `Tu es un expert en analyse visuelle pour la création de contenu HORECA (restaurants, hôtels, bars, chambres d'hôte).

Tu analyses une image et extrais des informations structurées qui serviront à :
1. Construire l'identité visuelle de la marque
2. Améliorer la cohérence des futurs contenus générés
3. Catégoriser le contenu pour réutilisation

**Format de sortie : JSON strict, sans markdown, sans backticks.**`)

  const userPrompt = `Analyse cette image et retourne EXACTEMENT ce JSON :

{
  "description": "Description précise en 1-2 phrases de ce qu'on voit",
  "tags": ["tag1", "tag2", "tag3", "..."],
  "dominantColors": ["#RRGGBB", "#RRGGBB", "#RRGGBB", "#RRGGBB", "#RRGGBB"],
  "mood": "Un seul mot ou expression courte : cozy_rustic / elegant_modern / casual_bright / luxe_dark / minimal / energetic / etc."
}

Règles :
- description : factuelle, ce qui est visible
- tags : 5-10 mots-clés concrets (plat, ambiance, technique, sujet)
- dominantColors : 4-6 couleurs hexa dominantes, dans l'ordre de prévalence
- mood : un mood word adapté au secteur HORECA

Rien d'autre dans ta réponse que le JSON.`

  // Map MIME type to Claude's expected media_type
  const validMediaType = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType)
    ? mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
    : 'image/jpeg'

  const message = await claude.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: validMediaType,
            data: base64,
          },
        },
        { type: 'text', text: userPrompt },
      ],
    }],
  })

  const textContent = message.content[0]
  const rawText = textContent.type === 'text' ? textContent.text : ''

  // Robust JSON extraction
  let parsed: { description: string; tags: string[]; dominantColors: string[]; mood: string }
  try {
    const cleanText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
    parsed = JSON.parse(cleanText)
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Réponse Claude non parsable')
    parsed = JSON.parse(match[0])
  }

  const inputTokens = message.usage.input_tokens
  const outputTokens = message.usage.output_tokens
  const cost = (inputTokens * 3 + outputTokens * 15) / 1_000_000

  return {
    description: parsed.description,
    tags: parsed.tags,
    dominantColors: parsed.dominantColors,
    mood: parsed.mood,
    cost: parseFloat(cost.toFixed(6)),
    tokensUsed: inputTokens + outputTokens,
  }
}
