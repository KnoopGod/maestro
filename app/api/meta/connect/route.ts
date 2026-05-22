import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { saveSocialAccount } from '@/lib/db/queries/social-accounts'
import { verifyPageToken } from '@/lib/agents/meta-publisher'

export async function POST(req: NextRequest) {
  try {
    const { clientId, page, connectInstagram } = await req.json()

    if (!clientId || !page) {
      return NextResponse.json({ error: 'clientId et page requis' }, { status: 400 })
    }

    // Verify the page token works
    const check = await verifyPageToken(page.id, page.accessToken)
    if (!check.valid) {
      return NextResponse.json(
        { error: `Token de page invalide : ${check.error}` },
        { status: 400 }
      )
    }

    // Save Facebook page connection
    const fbAccount = await saveSocialAccount({
      clientId,
      platform: 'facebook',
      handle: page.name,
      accountId: page.id,
      accessToken: page.accessToken,
      // Page Access Tokens are long-lived (never expire if user token was long-lived)
    })

    // Save Instagram if requested and available
    let igAccount = null
    if (connectInstagram && page.instagramAccount) {
      igAccount = await saveSocialAccount({
        clientId,
        platform: 'instagram',
        handle: page.instagramAccount.username,
        accountId: page.instagramAccount.id,
        accessToken: page.accessToken, // Same token works for IG via Graph API
      })
    }

    revalidatePath(`/clients/${clientId}`)
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
