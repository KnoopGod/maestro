import { NextResponse } from 'next/server'
import { getClient } from '@/lib/db/queries/clients'
import { extractBriefFromUrl } from '@/lib/agents/url-reader'

export async function POST(req: Request) {
  try {
    const { url, clientId } = await req.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL requise' }, { status: 400 })
    }
    if (!clientId) {
      return NextResponse.json({ error: 'clientId requis' }, { status: 400 })
    }

    // Basic URL validation
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'URL invalide' }, { status: 400 })
    }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: 'Seules les URLs HTTP/HTTPS sont acceptées' }, { status: 400 })
    }

    const client = await getClient(clientId)
    if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

    const result = await extractBriefFromUrl(url, client)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur analyse URL' },
      { status: 500 }
    )
  }
}
