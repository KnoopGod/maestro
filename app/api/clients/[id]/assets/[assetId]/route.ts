import { NextRequest, NextResponse } from 'next/server'
import { unlink } from 'node:fs/promises'
import { getAsset, deleteAsset, setAssetStarred } from '@/lib/db/queries/assets'
import { getAbsolutePath } from '@/lib/storage/extract-text'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  const { id: clientId, assetId } = await params
  const asset = await getAsset(assetId)
  // Verify the asset belongs to the client in the URL (prevents IDOR across clients).
  if (!asset || asset.clientId !== clientId) {
    return NextResponse.json({ error: 'Asset introuvable' }, { status: 404 })
  }

  // Remove file from disk
  try {
    await unlink(getAbsolutePath(asset.url))
  } catch {
    // ignore — file might be already gone
  }

  await deleteAsset(assetId)
  return NextResponse.json({ success: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  const { id: clientId, assetId } = await params
  const asset = await getAsset(assetId)
  // Verify the asset belongs to the client in the URL (prevents IDOR across clients).
  if (!asset || asset.clientId !== clientId) {
    return NextResponse.json({ error: 'Asset introuvable' }, { status: 404 })
  }

  const body = await req.json()

  if (typeof body.starred === 'boolean') {
    await setAssetStarred(assetId, body.starred)
  }

  return NextResponse.json({ success: true })
}
