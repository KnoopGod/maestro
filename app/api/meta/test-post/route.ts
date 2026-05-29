import { NextRequest, NextResponse } from 'next/server'
import { getSocialAccount } from '@/lib/db/queries/social-accounts'
import { publishToFacebook } from '@/lib/agents/meta-publisher'

export async function POST(req: NextRequest) {
  try {
    const { clientId, message } = await req.json()

    if (!clientId) return NextResponse.json({ error: 'clientId requis' }, { status: 400 })

    const fbAccount = await getSocialAccount(clientId, 'facebook')
    if (!fbAccount || !fbAccount.accessToken || !fbAccount.accountId) {
      return NextResponse.json(
        { error: 'Aucun compte Facebook connecté pour ce client' },
        { status: 400 }
      )
    }

    const testMessage = message || `🧪 Test depuis CODEXRS · ${new Date().toLocaleString('fr-FR')}\n\nCe post de test a été publié automatiquement pour vérifier la connexion. Vous pouvez le supprimer.`

    const result = await publishToFacebook({
      pageId: fbAccount.accountId,
      pageToken: fbAccount.accessToken,
      message: testMessage,
    })

    return NextResponse.json({
      success: true,
      postId: result.postId,
      url: result.url,
      handle: fbAccount.handle,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur test post'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
