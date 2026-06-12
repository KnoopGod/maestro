import { NextResponse } from 'next/server'
import { runProfitController } from '@/lib/agents/profit-controller'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const report = await runProfitController(id)
    return NextResponse.json(report)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur Profit Controller'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
