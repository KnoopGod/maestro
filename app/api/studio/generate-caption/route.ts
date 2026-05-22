import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/db/queries/clients'
import { generateCaption, type Platform } from '@/lib/agents/social-expert'

export async function POST(req: NextRequest) {
  try {
    const { clientId, brief, platforms, contentType } = await req.json()

    if (!clientId) return NextResponse.json({ error: 'clientId requis' }, { status: 400 })
    if (!brief) return NextResponse.json({ error: 'brief requis' }, { status: 400 })
    if (!Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: 'platforms requis (array non vide)' }, { status: 400 })
    }

    const client = await getClient(clientId)
    if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

    const result = await generateCaption({
      client,
      brief,
      platforms: platforms as Platform[],
      contentType,
    })

    return NextResponse.json({
      success: true,
      ...result,
      client: { id: client.id, name: client.name, emoji: client.emoji },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur de génération'
    const status = msg.includes('ANTHROPIC_API_KEY') ? 503 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
