import { NextRequest, NextResponse } from 'next/server'
import { Ollama } from 'ollama'

const ollama = new Ollama({ host: 'http://localhost:11434' })

export async function POST(req: NextRequest) {
  try {
    const { prompt, model = 'llama3.2:3b' } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'prompt requis' }, { status: 400 })
    }

    const response = await ollama.chat({
      model,
      messages: [{ role: 'user', content: prompt }],
    })

    return NextResponse.json({
      ai: 'ollama',
      model,
      response: response.message.content,
      tokensUsed: response.eval_count ?? 0,
      cost: 0,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur Ollama'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET() {
  try {
    const list = await ollama.list()
    return NextResponse.json({ status: 'active', models: list.models.map((m: { name: string }) => m.name) })
  } catch {
    return NextResponse.json({ status: 'inactive', models: [] })
  }
}
