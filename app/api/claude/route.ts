import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY non configurée dans .env.local' },
      { status: 503 }
    )
  }

  try {
    const { prompt, model = 'claude-sonnet-4-6', maxTokens = 1024 } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'prompt requis' }, { status: 400 })
    }

    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    const text = content.type === 'text' ? content.text : ''
    const inputTokens = message.usage.input_tokens
    const outputTokens = message.usage.output_tokens

    // Pricing claude-sonnet-4-6 : $3/1M input, $15/1M output
    const cost = (inputTokens * 3 + outputTokens * 15) / 1_000_000

    return NextResponse.json({
      ai: 'claude',
      model,
      response: text,
      tokensUsed: inputTokens + outputTokens,
      inputTokens,
      outputTokens,
      cost: parseFloat(cost.toFixed(6)),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur Claude API'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  return NextResponse.json({
    status: apiKey ? 'configured' : 'missing_key',
    model: 'claude-sonnet-4-6',
  })
}
