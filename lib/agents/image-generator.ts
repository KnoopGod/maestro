import OpenAI from 'openai'
import type { Client } from '@/types/client'
import type { VisualIdentity } from '@/types/asset'
import { createAsset } from '@/lib/db/queries/assets'
import { saveClientBuffer } from '@/lib/storage/local'

export function buildImagePrompt(input: {
  client: Client
  brief: string
  caption: string
  visualIdentity: VisualIdentity | null
}): string {
  const { client, brief, caption, visualIdentity } = input
  const da = visualIdentity?.stylePrompt
    ? `Visual direction to follow: ${visualIdentity.stylePrompt}.`
    : 'Natural premium hospitality photography, realistic lighting, appetizing composition.'

  return [
    `Create a premium, realistic social media image for a ${client.type} named "${client.name}" in ${client.city || 'France'}.`,
    `Post brief: ${brief}`,
    `Caption context: ${caption}`,
    da,
    'No text overlay, no watermark, no logo, no fake people close-up, no distorted food.',
    'The image must feel like a high-end but authentic photo from the actual venue, suitable for Instagram and Facebook.',
  ].join('\n')
}

export async function generateAndStoreImage(input: {
  client: Client
  brief: string
  caption: string
  visualIdentity: VisualIdentity | null
}): Promise<{ assetId: string; url: string; prompt: string; cost: number }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY non configurée')

  const prompt = buildImagePrompt(input)
  const openai = new OpenAI({ apiKey })

  const image = await openai.images.generate({
    model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1',
    prompt,
    size: '1024x1024',
  })

  const first = image.data?.[0]
  if (!first?.b64_json) {
    throw new Error("OpenAI n'a pas retourné d'image en base64")
  }

  const buffer = Buffer.from(first.b64_json, 'base64')
  const saved = await saveClientBuffer({
    clientId: input.client.id,
    buffer,
    mimeType: 'image/png',
    ext: '.png',
  })

  const asset = await createAsset({
    clientId: input.client.id,
    type: 'image',
    category: 'inspiration',
    filename: saved.filename,
    originalName: `generated-${Date.now()}.png`,
    url: saved.url,
    mimeType: saved.mimeType,
    sizeBytes: saved.sizeBytes,
  })

  return {
    assetId: asset.id,
    url: asset.url,
    prompt,
    // Approximation. Exact image pricing depends on model/quality.
    cost: 0.04,
  }
}
