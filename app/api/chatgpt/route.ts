import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY non configurée dans .env.local' },
      { status: 503 }
    )
  }

  try {
    const { prompt, model = 'gpt-4o', maxTokens = 1024 } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'prompt requis' }, { status: 400 })
    }

    const client = new OpenAI({ apiKey })

    const completion = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = completion.choices[0]?.message?.content ?? ''
    const inputTokens = completion.usage?.prompt_tokens ?? 0
    const outputTokens = completion.usage?.completion_tokens ?? 0

    // Pricing gpt-4o : $2.50/1M input, $10/1M output
    const cost = (inputTokens * 2.5 + outputTokens * 10) / 1_000_000

    return NextResponse.json({
      ai: 'chatgpt',
      model,
      response: text,
      tokensUsed: inputTokens + outputTokens,
      inputTokens,
      outputTokens,
      cost: parseFloat(cost.toFixed(6)),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur ChatGPT API'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY
  return NextResponse.json({
    status: apiKey ? 'configured' : 'missing_key',
    model: 'gpt-4o',
  })
}
