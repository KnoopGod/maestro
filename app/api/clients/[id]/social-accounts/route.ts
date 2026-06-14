import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/db/queries/clients'
import { saveSocialAccount } from '@/lib/db/queries/social-accounts'
import type { SocialPlatform } from '@/types/client'

const ALLOWED_PLATFORMS = new Set<SocialPlatform>(['linkedin'])

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params
  const client = await getClient(clientId)
  if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const platform = typeof body.platform === 'string' ? body.platform as SocialPlatform : null
  const accountId = typeof body.accountId === 'string' ? body.accountId.trim() : ''
  const handle = typeof body.handle === 'string' ? body.handle.trim() : ''
  const accessToken = typeof body.accessToken === 'string' ? body.accessToken.trim() : ''
  const expiresAt = typeof body.expiresAt === 'number' ? body.expiresAt : undefined

  if (!platform || !ALLOWED_PLATFORMS.has(platform)) {
    return NextResponse.json({ error: 'Plateforme non supportée par cette route.' }, { status: 400 })
  }
  if (!accountId || !accessToken) {
    return NextResponse.json({ error: 'accountId et accessToken sont requis.' }, { status: 400 })
  }

  const account = await saveSocialAccount({
    clientId,
    platform,
    handle: handle || accountId,
    accountId,
    accessToken,
    expiresAt,
  })

  return NextResponse.json({
    ok: true,
    account: {
      platform: account.platform,
      handle: account.handle,
      accountId: account.accountId,
      connectedAt: account.connectedAt,
      expiresAt: account.expiresAt,
    },
  })
}
