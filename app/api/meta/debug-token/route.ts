import { NextRequest, NextResponse } from 'next/server'
import { getSocialAccount } from '@/lib/db/queries/social-accounts'
import { debugToken } from '@/lib/agents/meta-publisher'

/**
 * Debug a stored Meta token for a given client.
 * Returns the actual permissions, validity, expiry, etc.
 *
 * Two modes:
 * - { clientId, platform } → debug the stored token for that client
 * - { token, pageId? }     → debug a raw token (e.g. before connecting)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    let token: string | undefined
    let pageId: string | undefined

    if (body.clientId) {
      const platform = body.platform || 'facebook'
      const account = await getSocialAccount(body.clientId, platform)
      if (!account?.accessToken) {
        return NextResponse.json({ error: 'Aucun token stocké pour ce client/plateforme' }, { status: 404 })
      }
      token = account.accessToken
      pageId = account.accountId ?? undefined
    } else if (typeof body.token === 'string' && body.token.trim()) {
      token = body.token.trim()
      pageId = body.pageId
    } else {
      return NextResponse.json({ error: 'clientId+platform OU token requis' }, { status: 400 })
    }

    const info = await debugToken(token!, pageId)
    return NextResponse.json(info)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur debug'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
