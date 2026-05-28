import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/db/queries/clients'
import { saveAiStrategy, getAiStrategy } from '@/lib/db/queries/clients'
import { generateStrategyAdvice } from '@/lib/agents/strategy-advisor'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const strategy = await getAiStrategy(id)
  return NextResponse.json({ strategy })
}

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const client = await getClient(id)
    if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

    const advice = await generateStrategyAdvice(client)
    await saveAiStrategy(id, advice)

    return NextResponse.json({ strategy: advice })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur génération stratégie' },
      { status: 500 }
    )
  }
}
