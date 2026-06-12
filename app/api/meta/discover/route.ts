import { NextRequest, NextResponse } from 'next/server'
import { discoverPages, exchangeForLongLivedUserToken } from '@/lib/agents/meta-publisher'

export async function POST(req: NextRequest) {
  try {
    const { userToken } = await req.json()
    const cleanToken = typeof userToken === 'string' ? userToken.trim() : ''
    if (!cleanToken) {
      return NextResponse.json({ error: 'userToken requis' }, { status: 400 })
    }

    const appCredentialsConfigured = Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET)

    // Try to exchange for a long-lived token (works only if META_APP_ID/SECRET set)
    let longLivedToken = cleanToken
    let tokenMode: 'long_lived' | 'short_lived' = 'short_lived'
    let tokenWarning: string | null = appCredentialsConfigured
      ? null
      : 'META_APP_ID et META_APP_SECRET ne sont pas configurés : le token risque d’expirer rapidement.'

    if (appCredentialsConfigured) {
      try {
        longLivedToken = await exchangeForLongLivedUserToken(cleanToken)
        tokenMode = longLivedToken === cleanToken ? 'short_lived' : 'long_lived'
      } catch (err) {
        tokenWarning = err instanceof Error
          ? `Échange en token longue durée impossible : ${err.message}`
          : 'Échange en token longue durée impossible.'
      }
    }

    // Discover pages with the (long-lived) token
    const result = await discoverPages(longLivedToken)

    return NextResponse.json({
      success: true,
      userName: result.userName,
      userId: result.userId,
      pages: result.pages.map(page => ({
        id: page.id,
        name: page.name,
        category: page.category,
        instagramAccount: page.instagramAccount,
        pictureUrl: page.pictureUrl,
      })),
      pagesCount: result.pages.length,
      pagesWithInstagram: result.pages.filter(p => p.instagramAccount).length,
      tokenExchange: {
        appCredentialsConfigured,
        mode: tokenMode,
        exchanged: tokenMode === 'long_lived',
        warning: tokenWarning,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur Meta API'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
