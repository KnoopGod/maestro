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
