import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { AGENT_MODELS, calcCost } from '@/lib/agents/config'

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY non configurée dans .env.local' },
      { status: 503 }
    )
  }

  try {
    const { prompt, model = AGENT_MODELS.sonnet, maxTokens = 1024 } = await req.json()

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

    const cost = model === AGENT_MODELS.haiku
      ? calcCost('haiku', inputTokens, outputTokens)
      : model === AGENT_MODELS.opus
        ? calcCost('opus', inputTokens, outputTokens)
        : calcCost('sonnet', inputTokens, outputTokens)

    return NextResponse.json({
      ai: 'claude',
      model,
      response: text,
      tokensUsed: inputTokens + outputTokens,
      inputTokens,
      outputTokens,
      cost,
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
    model: AGENT_MODELS.sonnet,
  })
}
