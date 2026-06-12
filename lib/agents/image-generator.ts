import OpenAI from 'openai'
import type { Client } from '@/types/client'
import type { VisualIdentity } from '@/types/asset'
import { createAsset } from '@/lib/db/queries/assets'
import { saveClientBuffer } from '@/lib/storage/local'

type ImageResponseItem = {
  b64_json?: string | null
  url?: string | null
}

export function buildImagePrompt(input: {
  client: Client
  brief: string
  caption: string
  visualIdentity: VisualIdentity | null
  visualPrompt?: string
  contentType?: string
}): string {
  const { client, brief, caption, visualIdentity, visualPrompt, contentType } = input
  const da = visualIdentity?.stylePrompt
    ? `Visual direction to follow: ${visualIdentity.stylePrompt}.`
    : 'Natural premium hospitality photography, realistic lighting, appetizing composition.'

  return [
    `Create a premium, realistic social media image for a ${client.type} named "${client.name}" in ${client.city || 'France'}.`,
    client.clientSummary ? `Client context to respect: ${client.clientSummary}` : null,
    `Post brief: ${brief}`,
    `Caption context: ${caption}`,
    contentType ? `Target social format: ${contentType}.` : null,
    visualPrompt?.trim() ? `Specific visual instruction from the user: ${visualPrompt.trim()}` : null,
    da,
    'Use a realistic hospitality photography style, coherent with a real client brand asset library.',
    'Avoid cheap stock-photo aesthetics, distorted food, fake unreadable signage, plastic textures, extra fingers, uncanny faces, and random brand logos.',
    'No text overlay, no watermark. If a logo is requested, imply the brand atmosphere instead of inventing unreadable logo text.',
    'The image must feel like a high-end but authentic photo from the actual venue, suitable for Instagram and Facebook.',
  ].filter(Boolean).join('\n')
}

export async function generateAndStoreImage(input: {
  client: Client
  brief: string
  caption: string
  visualIdentity: VisualIdentity | null
  visualPrompt?: string
  contentType?: string
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
  const buffer = await imageResponseToBuffer(first)
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

async function imageResponseToBuffer(first: ImageResponseItem | undefined): Promise<Buffer> {
  if (!first) throw new Error("OpenAI n'a retourné aucune image")
  if (first.b64_json) return Buffer.from(first.b64_json, 'base64')
  if (first.url) {
    const response = await fetch(first.url)
    if (!response.ok) throw new Error(`Image OpenAI non téléchargeable (${response.status})`)
    return Buffer.from(await response.arrayBuffer())
  }
  throw new Error("OpenAI n'a retourné ni base64 ni URL d'image")
}
