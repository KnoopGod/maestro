import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSocialAccount, saveSocialAccount } from '@/lib/db/queries/social-accounts'
import {
  debugToken,
  discoverInstagramAccountForPage,
  discoverPages,
  exchangeForLongLivedUserToken,
  verifyPageToken,
  type MetaPage,
} from '@/lib/agents/meta-publisher'

export async function POST(req: NextRequest) {
  try {
    const { clientId, page, pageId, userToken, connectInstagram, syncInstagram } = await req.json()

    if (!clientId) {
      return NextResponse.json({ error: 'clientId requis' }, { status: 400 })
    }

    if (syncInstagram) {
      const fbAccount = await getSocialAccount(clientId, 'facebook')
      if (!fbAccount?.accountId || !fbAccount.accessToken) {
        return NextResponse.json({ error: 'Facebook doit être connecté avant Instagram' }, { status: 400 })
      }

      const instagramAccount = await discoverInstagramAccountForPage(fbAccount.accountId, fbAccount.accessToken)
      if (!instagramAccount) {
        return NextResponse.json(
          { error: 'Aucun compte Instagram professionnel lié à cette page Facebook' },
          { status: 404 }
        )
      }

      const igAccount = await saveSocialAccount({
        clientId,
        platform: 'instagram',
        handle: instagramAccount.username,
        accountId: instagramAccount.id,
        accessToken: fbAccount.accessToken,
      })

      revalidatePath(`/clients/${clientId}`)
      revalidatePath(`/clients/${clientId}/setup`)
      revalidatePath(`/clients/${clientId}/connections`)

      return NextResponse.json({
        success: true,
        instagram: igAccount,
      })
    }

    const resolvedPage = await resolvePageForConnection({ page, pageId, userToken })

    // Verify the page token works
    const check = await verifyPageToken(resolvedPage.id, resolvedPage.accessToken)
    if (!check.valid) {
      return NextResponse.json(
        { error: `Token de page invalide : ${check.error}` },
        { status: 400 }
      )
    }

    const tokenInfo = await debugToken(resolvedPage.accessToken, resolvedPage.id)
    if (!tokenInfo.valid) {
      return NextResponse.json(
        { error: `Token de page non validable : ${tokenInfo.error || 'debug_token invalide'}` },
        { status: 400 }
      )
    }
    if (tokenInfo.missingPermissions.length > 0) {
      return NextResponse.json(
        {
          error: `Permissions Meta manquantes pour publier : ${tokenInfo.missingPermissions.join(', ')}`,
          missingPermissions: tokenInfo.missingPermissions,
        },
        { status: 400 }
      )
    }

    // Save Facebook page connection
    const fbAccount = await saveSocialAccount({
      clientId,
      platform: 'facebook',
      handle: resolvedPage.name,
      accountId: resolvedPage.id,
      accessToken: resolvedPage.accessToken,
      expiresAt: tokenInfo.expiresAt ?? undefined,
      // Page Access Tokens are long-lived (never expire if user token was long-lived)
    })

    // Save Instagram if requested and available
    let igAccount = null
    if (connectInstagram && resolvedPage.instagramAccount) {
      igAccount = await saveSocialAccount({
        clientId,
        platform: 'instagram',
        handle: resolvedPage.instagramAccount.username,
        accountId: resolvedPage.instagramAccount.id,
        accessToken: resolvedPage.accessToken, // Same token works for IG via Graph API
        expiresAt: tokenInfo.expiresAt ?? undefined,
      })
    }

    revalidatePath(`/clients/${clientId}`)
    revalidatePath(`/clients/${clientId}/setup`)
    revalidatePath(`/clients/${clientId}/connections`)

    return NextResponse.json({
      success: true,
      facebook: fbAccount,
      instagram: igAccount,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur sauvegarde'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

async function resolvePageForConnection(input: {
  page?: MetaPage
  pageId?: string
  userToken?: string
}): Promise<MetaPage> {
  if (input.page?.id && input.page.accessToken) {
    return input.page
  }

  if (!input.pageId || !input.userToken) {
    throw new Error('pageId + userToken requis pour connecter Meta')
  }

  let longLivedToken = input.userToken
  try {
    longLivedToken = await exchangeForLongLivedUserToken(input.userToken)
  } catch {
    // Keep the short-lived token as a fallback; token diagnostics will expose expiry issues.
  }

  const result = await discoverPages(longLivedToken)
  const page = result.pages.find(p => p.id === input.pageId)
  if (!page) {
    throw new Error('Page introuvable avec ce token utilisateur. Vérifie les accès Pages acceptés dans Meta.')
  }

  return page
}

export async function DELETE(req: NextRequest) {
  try {
    const { clientId, platform } = await req.json()
    const { deleteSocialAccount } = await import('@/lib/db/queries/social-accounts')
    await deleteSocialAccount(clientId, platform)
    revalidatePath(`/clients/${clientId}`)
    revalidatePath(`/clients/${clientId}/connections`)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur suppression'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
