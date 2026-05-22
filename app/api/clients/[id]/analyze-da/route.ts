import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/db/queries/clients'
import {
  listClientAssets,
  updateAssetAnalysis,
  upsertVisualIdentity,
} from '@/lib/db/queries/assets'
import { analyzeImage } from '@/lib/agents/vision-analyzer'
import { synthesizeVisualIdentity } from '@/lib/agents/visual-identity'

export const maxDuration = 300 // 5 min for large batches

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params

  try {
    const client = await getClient(clientId)
    if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

    const allAssets = await listClientAssets(clientId)
    const images = allAssets.filter(a => (a.type === 'image' || a.type === 'logo'))
    const toAnalyze = images.filter(a => !a.analyzedAt)

    let totalImageCost = 0
    let analyzedCount = 0
    const errors: string[] = []

    // 1. Analyze each not-yet-analyzed image
    for (const asset of toAnalyze) {
      try {
        const analysis = await analyzeImage(asset.url, asset.mimeType)
        await updateAssetAnalysis(asset.id, {
          aiDescription: analysis.description,
          aiTags: analysis.tags,
          dominantColors: analysis.dominantColors,
          mood: analysis.mood,
        })
        totalImageCost += analysis.cost
        analyzedCount++
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'analyse échouée'
        errors.push(`${asset.originalName}: ${msg}`)
      }
    }

    // 2. Re-fetch assets with their now-analyzed metadata
    const updatedAssets = await listClientAssets(clientId)

    // 3. Synthesize visual identity from all analyzed data
    const synth = await synthesizeVisualIdentity(client, updatedAssets)

    // 4. Persist visual identity
    const identity = await upsertVisualIdentity({
      clientId,
      palette: synth.palette,
      lightingStyle: synth.lightingStyle,
      overallMood: synth.overallMood,
      compositionPref: synth.compositionPref,
      styleKeywords: synth.styleKeywords,
      avoidKeywords: synth.avoidKeywords,
      stylePrompt: synth.stylePrompt,
      visualSummary: synth.visualSummary,
      assetsCount: updatedAssets.length,
    })

    return NextResponse.json({
      success: true,
      analyzed: analyzedCount,
      total_images: images.length,
      already_analyzed: images.length - toAnalyze.length,
      errors,
      cost: {
        images: parseFloat(totalImageCost.toFixed(4)),
        synthesis: synth.cost,
        total: parseFloat((totalImageCost + synth.cost).toFixed(4)),
      },
      identity,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
