import OpenAI, { toFile } from 'openai'
import { AGENT_MODELS } from '@/lib/agents/config'

/**
 * Photo Enhancer — sublime une vraie photo (plat, cocktail) SANS la dénaturer.
 *
 * Cœur du positionnement Snap Studio : « l'authenticité augmentée ».
 * Le plat photographié doit rester EXACTEMENT le plat servi — on améliore
 * la lumière, les couleurs et la netteté, jamais le contenu.
 *
 * Prompt v1 — 2026-07 : validé via le Labo /labs/enhance avant la mise en
 * production de Snap Studio (spec 142).
 */

export interface EnhancePhotoInput {
  sourceBuffer: Buffer
  mimeType: string
  /** Indication de style issue de la DA du client (identity.stylePrompt) — optionnelle. */
  styleHint?: string
}

export interface EnhancePhotoOutput {
  enhancedBuffer: Buffer | null
  promptUsed: string
  cost: number
  model: string
  durationMs: number
}

function buildEnhancePrompt(styleHint?: string): string {
  return [
    'Professional photo retouching of this real food/drink photograph taken by an amateur.',
    'ENHANCE ONLY: lighting (warm, appetizing, natural), color balance, contrast, sharpness,',
    'depth of field (subtle background blur), and remove visual noise or harsh flash effects.',
    '',
    'STRICT RULES — this is a retouch, NOT a recreation:',
    '- Keep the EXACT same dish/drink: same ingredients, same portions, same plating, same garnish.',
    '- Keep the same plate, glass, table, background and composition.',
    '- Do NOT add, remove, move or replace any food, object or decoration.',
    '- Do NOT change the camera angle or crop away important parts of the dish.',
    '- The result must be recognizable as the SAME photo, professionally retouched.',
    '- No text, no watermark, no logo.',
    styleHint?.trim()
      ? `Brand mood to respect in the color grading only (never in the content): ${styleHint.trim()}`
      : 'Aim for an authentic premium bistro/editorial photography look.',
  ].join('\n')
}

export async function enhancePhoto(input: EnhancePhotoInput): Promise<EnhancePhotoOutput> {
  const apiKey = process.env.OPENAI_API_KEY
  const prompt = buildEnhancePrompt(input.styleHint)
  const startedAt = Date.now()

  if (!apiKey) {
    return { enhancedBuffer: null, promptUsed: prompt, cost: 0, model: 'none', durationMs: 0 }
  }

  try {
    const openai = new OpenAI({ apiKey })

    const editParams = {
      model: AGENT_MODELS.image,
      image: await toFile(input.sourceBuffer, 'source.png', { type: input.mimeType }),
      prompt,
      size: '1024x1024',
      // Champ gpt-image-1 qui maximise la préservation des détails de la photo
      // source — essentiel pour que le plat reste "le même plat". Pas encore
      // présent dans les types du SDK installé, d'où le cast.
      input_fidelity: 'high',
    }
    // Cast du retour : sans `stream: true`, la réponse est toujours ImagesResponse.
    const result = await openai.images.edit(
      editParams as unknown as Parameters<typeof openai.images.edit>[0]
    ) as OpenAI.Images.ImagesResponse

    const first = result.data?.[0]
    if (!first?.b64_json) {
      return { enhancedBuffer: null, promptUsed: prompt, cost: 0, model: AGENT_MODELS.image, durationMs: Date.now() - startedAt }
    }

    return {
      enhancedBuffer: Buffer.from(first.b64_json, 'base64'),
      promptUsed: prompt,
      // Approximation edit 1024² fidélité haute — suivi précis via le dashboard OpenAI.
      cost: 0.07,
      model: AGENT_MODELS.image,
      durationMs: Date.now() - startedAt,
    }
  } catch (err) {
    console.error('[photo-enhancer] edit failed:', err instanceof Error ? err.message : err)
    // Jamais bloquant : le flux appelant continue avec la photo originale.
    return { enhancedBuffer: null, promptUsed: prompt, cost: 0, model: AGENT_MODELS.image, durationMs: Date.now() - startedAt }
  }
}
