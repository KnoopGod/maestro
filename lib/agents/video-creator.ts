/**
 * Video Creator — Luma Dream Machine image-to-video
 *
 * Takes an existing image asset + prompt, submits to Luma, polls until done.
 * Returns a Luma generation ID immediately (async); poll with pollVideoGeneration().
 */

const LUMA_API = 'https://api.lumalabs.ai/dream-machine/v1'

export type VideoStatus = 'pending' | 'dreaming' | 'completed' | 'failed'

export interface VideoGeneration {
  generationId: string
  status: VideoStatus
  videoUrl?: string
  thumbnailUrl?: string
  error?: string
}

// ─── Luma API calls ───────────────────────────────────────────────────────────

export async function startVideoGeneration(input: {
  imageUrl: string
  prompt: string
  aspectRatio?: '9:16' | '16:9' | '1:1'
}): Promise<VideoGeneration> {
  const apiKey = process.env.LUMA_API_KEY
  if (!apiKey) throw new Error('LUMA_API_KEY non configurée — ajoute-la dans les variables d\'environnement')

  const res = await fetch(`${LUMA_API}/generations/image-to-video`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: input.prompt,
      aspect_ratio: input.aspectRatio ?? '9:16',
      keyframes: {
        frame0: { type: 'image', url: input.imageUrl },
      },
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    const msg = data.detail || data.message || JSON.stringify(data)
    throw new Error(`Luma API : ${msg}`)
  }

  return {
    generationId: data.id,
    status: data.state ?? 'pending',
  }
}

export async function pollVideoGeneration(generationId: string): Promise<VideoGeneration> {
  const apiKey = process.env.LUMA_API_KEY
  if (!apiKey) throw new Error('LUMA_API_KEY non configurée')

  const res = await fetch(`${LUMA_API}/generations/${generationId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  })

  const data = await res.json()
  if (!res.ok) {
    const msg = data.detail || data.message || JSON.stringify(data)
    throw new Error(`Luma API : ${msg}`)
  }

  return {
    generationId: data.id,
    status: data.state ?? 'pending',
    videoUrl: (data.assets?.video as string | undefined) ?? undefined,
    thumbnailUrl: (data.assets?.thumbnail as string | undefined) ?? undefined,
    error: (data.failure_reason as string | undefined) ?? undefined,
  }
}

// ─── Integrated pipeline function (for pipeline.ts) ──────────────────────────

import type { Client } from '@/types/client'
import { saveClientBuffer } from '@/lib/storage/local'
import { createAsset } from '@/lib/db/queries/assets'

export interface VideoCreatorInput {
  client: Client
  brief: string
  prompt: string
  sourceImageUrl?: string
  contentType: 'reel' | 'story'
  jobId?: string
}

export interface VideoCreatorResult {
  assetId?: string
  url?: string
  prompt: string
  cost: number
  lumaGenerationId?: string
}

const POLL_INTERVAL_MS = 5_000
const POLL_MAX_ATTEMPTS = 24

export async function generateVideo(input: VideoCreatorInput): Promise<VideoCreatorResult> {
  const apiKey = process.env.LUMA_API_KEY
  if (!apiKey) throw new Error('LUMA_API_KEY non configuré')

  const body: Record<string, unknown> = {
    prompt: input.prompt || input.brief,
    aspect_ratio: '9:16',
    loop: false,
  }

  if (input.sourceImageUrl) {
    body.keyframes = { frame0: { type: 'image', url: input.sourceImageUrl } }
  }

  const createRes = await fetch(`${LUMA_API}/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!createRes.ok) {
    const err = await createRes.text()
    throw new Error(`Luma API erreur création (${createRes.status}): ${err}`)
  }

  const { id: lumaGenerationId } = await createRes.json() as { id: string; state: string }

  let videoUrl: string | undefined
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL_MS))

    const pollRes = await fetch(`${LUMA_API}/generations/${lumaGenerationId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (!pollRes.ok) continue

    const gen = await pollRes.json() as {
      state: string
      assets?: { video?: string }
      failure_reason?: string
    }

    if (gen.state === 'completed') { videoUrl = gen.assets?.video; break }
    if (gen.state === 'failed') throw new Error(`Luma génération échouée : ${gen.failure_reason ?? 'raison inconnue'}`)
  }

  if (!videoUrl) throw new Error('Luma : timeout — vidéo non disponible après 120 secondes')

  const videoRes = await fetch(videoUrl)
  if (!videoRes.ok) throw new Error(`Impossible de télécharger la vidéo Luma (${videoRes.status})`)
  const buffer = Buffer.from(await videoRes.arrayBuffer())

  const saved = await saveClientBuffer({ clientId: input.client.id, buffer, mimeType: 'video/mp4', ext: '.mp4' })

  const asset = await createAsset({
    clientId: input.client.id,
    type: 'video',
    category: 'other',
    filename: saved.filename,
    originalName: `luma-${lumaGenerationId}.mp4`,
    url: saved.url,
    mimeType: saved.mimeType,
    sizeBytes: saved.sizeBytes,
  })

  return { assetId: asset.id, url: asset.url, prompt: input.prompt || input.brief, cost: 0, lumaGenerationId }
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

export function buildVideoPrompt(input: {
  caption?: string | null
  brief?: string | null
  mood?: string | null
}): string {
  const subject = (input.caption ?? input.brief ?? 'HORECA ambiance').slice(0, 120)
  return (
    `${subject}. ` +
    'Smooth cinematic motion, gentle parallax, warm atmospheric lighting, ' +
    'professional food & hospitality photography style, no text, no watermarks.'
  )
}
