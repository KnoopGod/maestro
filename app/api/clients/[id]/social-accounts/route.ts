import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/db/queries/clients'
import { saveSocialAccount, deleteSocialAccount } from '@/lib/db/queries/social-accounts'
import type { SocialPlatform } from '@/types/client'

const ALLOWED_PLATFORMS: SocialPlatform[] = ['instagram', 'facebook', 'tiktok', 'linkedin', 'google_business']

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const client = await getClient(id)
  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

  let body: { platform?: unknown; handle?: unknown; accountId?: unknown; accessToken?: unknown; expiresAt?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  const { platform, handle, accountId, accessToken, expiresAt } = body

  if (!ALLOWED_PLATFORMS.includes(platform as SocialPlatform)) {
    return NextResponse.json({ error: 'Plateforme invalide' }, { status: 400 })
  }
  if (typeof accountId !== 'string' || !accountId.trim()) {
    return NextResponse.json({ error: 'accountId requis' }, { status: 400 })
  }
  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    return NextResponse.json({ error: 'accessToken requis' }, { status: 400 })
  }

  const account = await saveSocialAccount({
    clientId: id,
    platform: platform as SocialPlatform,
    handle: typeof handle === 'string' ? handle.trim() : accountId as string,
    accountId: (accountId as string).trim(),
    accessToken: (accessToken as string).trim(),
    expiresAt: typeof expiresAt === 'number' ? expiresAt : undefined,
  })

  return NextResponse.json({ ok: true, account: { id: account.id, platform: account.platform } })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const client = await getClient(id)
  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

  let body: { platform?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalide' }, { status: 400 })
  }

  if (!ALLOWED_PLATFORMS.includes(body.platform as SocialPlatform)) {
    return NextResponse.json({ error: 'Plateforme invalide' }, { status: 400 })
  }

  await deleteSocialAccount(id, body.platform as SocialPlatform)
  return NextResponse.json({ ok: true })
}
