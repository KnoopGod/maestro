import { NextRequest, NextResponse } from 'next/server'
import { enhancePhoto } from '@/lib/agents/photo-enhancer'
import { validateUploadContent } from '@/lib/storage/validate-upload'

export const dynamic = 'force-dynamic'
// La retouche gpt-image-1 en fidélité haute peut prendre 30-90 s.
export const maxDuration = 120

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_SIZE = 15 * 1024 * 1024 // 15 Mo

/**
 * Labo retouche (POC Snap Studio, spec 142) — route protégée par le middleware
 * admin (hors PUBLIC_PATHS). Reçoit une photo réelle, retourne la version
 * sublimée en data URL pour comparaison avant/après immédiate. Aucun stockage.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('photo')
    const styleHint = String(formData.get('styleHint') ?? '').trim() || undefined

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Aucune photo reçue' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Photo trop volumineuse (max 15 Mo)' }, { status: 413 })
    }
    if (!ALLOWED_MIMES.has(file.type)) {
      return NextResponse.json({ error: `Format non supporté : ${file.type}. Utilisez JPEG, PNG ou WebP.` }, { status: 415 })
    }
    const contentError = await validateUploadContent(file, file.type)
    if (contentError) {
      return NextResponse.json({ error: contentError }, { status: 415 })
    }

    const sourceBuffer = Buffer.from(await file.arrayBuffer())
    const result = await enhancePhoto({ sourceBuffer, mimeType: file.type, styleHint })

    if (!result.enhancedBuffer) {
      return NextResponse.json(
        { error: 'La retouche a échoué — vérifier OPENAI_API_KEY et réessayer.', promptUsed: result.promptUsed },
        { status: 502 }
      )
    }

    return NextResponse.json({
      enhanced: `data:image/png;base64,${result.enhancedBuffer.toString('base64')}`,
      promptUsed: result.promptUsed,
      cost: result.cost,
      model: result.model,
      durationMs: result.durationMs,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur labo retouche' },
      { status: 500 }
    )
  }
}
