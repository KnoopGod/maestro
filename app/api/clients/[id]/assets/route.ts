import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/db/queries/clients'
import { createAsset, listClientAssets } from '@/lib/db/queries/assets'
import { saveClientFile } from '@/lib/storage/local'
import { extractTextFromFile, getAbsolutePath } from '@/lib/storage/extract-text'
import { detectAssetType, type AssetCategory } from '@/types/asset'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const assets = await listClientAssets(id)
  return NextResponse.json({ assets })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params

  const client = await getClient(clientId)
  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

  const formData = await req.formData()
  const files = formData.getAll('files') as File[]
  const category = (formData.get('category') as AssetCategory | null) ?? null

  if (files.length === 0) {
    return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 })
  }

  const ALLOWED_MIMES = new Set([
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/quicktime',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'text/markdown',
  ])
  const MAX_SIZE = 100 * 1024 * 1024 // 100 MB

  const created = []

  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) continue

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `Fichier trop volumineux (max 100 MB) : ${file.name}` }, { status: 413 })
    }
    if (!ALLOWED_MIMES.has(file.type)) {
      return NextResponse.json({ error: `Type de fichier non autorisé : ${file.type}` }, { status: 415 })
    }

    // Save physically
    const saved = await saveClientFile(clientId, file)

    // Detect type
    const mimeType = saved.mimeType
    let assetType = detectAssetType(mimeType)

    // Override for brand guides (uploaded with category = guideline)
    if (category === 'guideline' && assetType === 'document') {
      assetType = 'brand_guide'
    }

    // Extract text for documents
    let extractedText: string | undefined
    if (assetType === 'document' || assetType === 'brand_guide') {
      const text = await extractTextFromFile(getAbsolutePath(saved.url), mimeType)
      if (text) extractedText = text
    }

    const asset = await createAsset({
      clientId,
      type: assetType,
      category: category ?? undefined,
      filename: saved.filename,
      originalName: file.name,
      url: saved.url,
      mimeType,
      sizeBytes: saved.sizeBytes,
      extractedText,
    })

    created.push(asset)
  }

  return NextResponse.json({ created, count: created.length })
}
