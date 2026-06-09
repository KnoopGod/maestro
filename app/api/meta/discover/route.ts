import { NextRequest, NextResponse } from 'next/server'
import { discoverPages, exchangeForLongLivedUserToken } from '@/lib/agents/meta-publisher'

export async function POST(req: NextRequest) {
  try {
    const { userToken } = await req.json()
    if (!userToken) {
      return NextResponse.json({ error: 'userToken requis' }, { status: 400 })
    }

    // Try to exchange for a long-lived token (works only if META_APP_ID/SECRET set)
    let longLivedToken = userToken
    try {
      longLivedToken = await exchangeForLongLivedUserToken(userToken)
    } catch {
      // Fallback to short-lived token
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
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur Meta API'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
