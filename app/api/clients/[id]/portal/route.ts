import { NextRequest, NextResponse } from 'next/server'
import { ensurePortalToken, rotatePortalToken } from '@/lib/db/queries/portal'

// Protégé par l'auth admin (proxy.ts) — seul l'agence peut lire/régénérer le lien.

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await ensurePortalToken(id)
  if (!token) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
  return NextResponse.json({ token })
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = await rotatePortalToken(id)
  if (!token) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
  return NextResponse.json({ token })
}
