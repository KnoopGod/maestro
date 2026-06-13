import { NextRequest, NextResponse } from 'next/server'
import { Ollama } from 'ollama'

const ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://localhost:11434' })

export async function POST(req: NextRequest) {
  try {
    const { prompt, model = 'llama3.2:3b' } = await req.json()
    if (!prompt) return NextResponse.json({ error: 'prompt requis' }, { status: 400 })

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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ollama indisponible'
    return NextResponse.json({ ai: 'ollama', error: message, tokensUsed: 0, cost: 0 }, { status: 503 })
  }
}

export async function GET() {
  const list = await ollama.list().catch(() => null)
  return NextResponse.json({
    status: list ? 'active' : 'inactive',
    models: list?.models?.map((model: { name: string }) => model.name) ?? [],
  })
}
