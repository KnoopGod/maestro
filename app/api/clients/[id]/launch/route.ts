import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/db/queries/clients'
import { getLaunchTunnel, saveLaunchAdvice, toggleLaunchTask } from '@/lib/db/queries/launch-tunnel'
import { runLaunchAdvisor } from '@/lib/agents/launch-advisor'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const state = await getLaunchTunnel(id)
  return NextResponse.json(state)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await req.json()

    if (body.action === 'toggle' && typeof body.taskKey === 'string') {
      const tasksDone = await toggleLaunchTask(id, body.taskKey)
      return NextResponse.json({ tasksDone })
    }

    if (body.action === 'advice') {
      const client = await getClient(id)
      if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

      const { advice, cost, tokensUsed, model } = await runLaunchAdvisor(client)
      await saveLaunchAdvice(id, advice, cost)
      return NextResponse.json({ advice, cost, tokensUsed, model })
    }

    return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur tunnel de lancement' },
      { status: 500 }
    )
  }
}
