import { NextRequest, NextResponse } from 'next/server'
import { runPageCommandAgent } from '@/lib/agents/page-command-agent'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const path = typeof body.path === 'string' ? body.path : '/'
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''

  if (!prompt) {
    return NextResponse.json({ error: 'Ordre vide' }, { status: 400 })
  }

  const result = await runPageCommandAgent({ path, prompt })
  return NextResponse.json(result)
}
