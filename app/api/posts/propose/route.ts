import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/db/queries/clients'
import { proposePostIdeas } from '@/lib/agents/planner'

export async function POST(req: NextRequest) {
  try {
    const { clientId, count } = await req.json()
    if (!clientId) {
      return NextResponse.json({ error: 'clientId requis' }, { status: 400 })
    }
    const client = await getClient(clientId)
    if (!client) {
      return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
    }

    const result = await proposePostIdeas(client, count || 5)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur planner'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
