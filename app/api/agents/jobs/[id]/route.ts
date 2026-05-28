import { NextResponse } from 'next/server'
import { getJobWithEvents } from '@/lib/db/queries/agent-jobs'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const job = await getJobWithEvents(id)
    if (!job) return NextResponse.json({ error: 'Job introuvable' }, { status: 404 })
    return NextResponse.json({ job })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur' }, { status: 500 })
  }
}
