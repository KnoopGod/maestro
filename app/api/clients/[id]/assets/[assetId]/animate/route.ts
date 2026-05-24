import { NextRequest, NextResponse } from 'next/server'
import { getAsset, createAsset, updateAssetAnalysis } from '@/lib/db/queries/assets'
import { getClient } from '@/lib/db/queries/clients'
import { saveClientBuffer } from '@/lib/storage/local'
import {
  startVideoGeneration,
  pollVideoGeneration,
  buildVideoPrompt,
} from '@/lib/agents/video-creator'
import { toPublicUrl } from '@/lib/agents/publish-pipeline'

type Params = { params: Promise<{ id: string; assetId: string }> }

/**
 * POST — start a Luma image-to-video generation.
 * Body: { brief?: string, caption?: string, aspectRatio?: '9:16'|'16:9'|'1:1' }
 * Returns: { generationId, status }
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id: clientId, assetId } = await params
    const body = await req.json().catch(() => ({}))

    const asset = await getAsset(assetId)
    if (!asset || asset.clientId !== clientId) {
      return NextResponse.json({ error: 'Asset introuvable' }, { status: 404 })
    }
    if (asset.type !== 'image' && asset.type !== 'logo') {
      return NextResponse.json({ error: 'Seules les images peuvent être animées' }, { status: 400 })
    }

    // Resolve a publicly accessible URL (Vercel Blob gives absolute URLs; local needs MAESTRO_PUBLIC_URL)
    const publicUrl = toPublicUrl(asset.url) ?? asset.url
    if (/localhost|127\.0\.0\.1/.test(publicUrl)) {
      return NextResponse.json(
        { error: 'L\'image doit être sur une URL publique. Configure MAESTRO_PUBLIC_URL ou Vercel Blob.' },
        { status: 400 }
      )
    }

    const prompt = buildVideoPrompt({
      caption: body.caption ?? null,
      brief: body.brief ?? asset.aiDescription ?? null,
      mood: asset.mood ?? null,
    })

    const generation = await startVideoGeneration({
      imageUrl: publicUrl,
      prompt,
      aspectRatio: body.aspectRatio ?? '9:16',
    })

    return NextResponse.json({ generationId: generation.generationId, status: generation.status, prompt })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur démarrage vidéo' },
      { status: 500 }
    )
  }
}

/**
 * GET — poll generation status.
 * Query: ?generationId=xxx
 * When completed: downloads video, stores it, creates a video asset, returns { status, asset }.
 */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id: clientId, assetId } = await params
    const generationId = req.nextUrl.searchParams.get('generationId')
    if (!generationId) return NextResponse.json({ error: 'generationId manquant' }, { status: 400 })

    const sourceAsset = await getAsset(assetId)
    if (!sourceAsset || sourceAsset.clientId !== clientId) {
      return NextResponse.json({ error: 'Asset source introuvable' }, { status: 404 })
    }

    const generation = await pollVideoGeneration(generationId)

    if (generation.status === 'failed') {
      return NextResponse.json({ status: 'failed', error: generation.error ?? 'Génération échouée' })
    }

    if (generation.status !== 'completed' || !generation.videoUrl) {
      return NextResponse.json({ status: generation.status })
    }

    // Download + store the video
    const client = await getClient(clientId)
    if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

    const videoRes = await fetch(generation.videoUrl)
    if (!videoRes.ok) throw new Error('Impossible de télécharger la vidéo Luma')
    const buffer = Buffer.from(await videoRes.arrayBuffer())

    const saved = await saveClientBuffer({
      clientId,
      buffer,
      mimeType: 'video/mp4',
      ext: '.mp4',
    })

    const baseName = sourceAsset.originalName.replace(/\.[^.]+$/, '')
    const videoAsset = await createAsset({
      clientId,
      type: 'video',
      category: sourceAsset.category ?? undefined,
      filename: saved.filename,
      originalName: `${baseName}_reel.mp4`,
      url: saved.url,
      thumbnailUrl: generation.thumbnailUrl ?? undefined,
      mimeType: 'video/mp4',
      sizeBytes: saved.sizeBytes,
    })
    await updateAssetAnalysis(videoAsset.id, {
      aiDescription: `Reel animé depuis « ${sourceAsset.originalName} » via Luma Dream Machine.`,
    })

    return NextResponse.json({ status: 'completed', asset: videoAsset })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur polling vidéo' },
      { status: 500 }
    )
  }
}
