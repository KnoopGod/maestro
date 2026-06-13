import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { Ollama } from 'ollama'

const TASK_PATTERNS = {
  image: /image|photo|visuel|bannière|logo|illustration|dalle|génère.*(image|visuel)/i,
  code: /code|programme|fonction|script|bug|erreur|typescript|javascript|python|react/i,
  strategy: /stratégie|architecture|plan|analyse|vision|roadmap|objectif/i,
}

type AIChoice = 'claude' | 'chatgpt' | 'ollama'

interface AiResult {
  response: string
  tokensUsed: number
  cost: number
  model: string
}

function chooseAI(prompt: string): { ai: AIChoice; reason: string; taskType: string } {
  if (TASK_PATTERNS.image.test(prompt)) return { ai: 'chatgpt', reason: 'Tâche visuelle → ChatGPT', taskType: 'image' }
  if (TASK_PATTERNS.code.test(prompt)) return { ai: 'claude', reason: 'Tâche code → Claude', taskType: 'code' }
  if (TASK_PATTERNS.strategy.test(prompt)) return { ai: 'claude', reason: 'Tâche stratégique → Claude', taskType: 'strategy' }
  return { ai: 'ollama', reason: 'Tâche simple → Ollama local', taskType: 'general' }
}

async function callClaude(prompt: string): Promise<AiResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY non configurée')

  const client = new Anthropic({ apiKey })
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })
  const content = message.content[0]
  const response = content.type === 'text' ? content.text : ''
  const inputTokens = message.usage.input_tokens
  const outputTokens = message.usage.output_tokens
  return {
    response,
    tokensUsed: inputTokens + outputTokens,
    cost: parseFloat(((inputTokens * 3 + outputTokens * 15) / 1_000_000).toFixed(6)),
    model: 'claude-sonnet-4-6',
  }
}

async function callChatGPT(prompt: string): Promise<AiResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY non configurée')

  const client = new OpenAI({ apiKey })
  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })
  const response = completion.choices[0]?.message?.content ?? ''
  const inputTokens = completion.usage?.prompt_tokens ?? 0
  const outputTokens = completion.usage?.completion_tokens ?? 0
  return {
    response,
    tokensUsed: inputTokens + outputTokens,
    cost: parseFloat(((inputTokens * 2.5 + outputTokens * 10) / 1_000_000).toFixed(6)),
    model: 'gpt-4o',
  }
}

async function callOllama(prompt: string): Promise<AiResult> {
  const ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://localhost:11434' })
  const response = await ollama.chat({
    model: 'llama3.2:3b',
    messages: [{ role: 'user', content: prompt }],
  })
  return {
    response: response.message.content,
    tokensUsed: response.eval_count ?? 0,
    cost: 0,
    model: 'llama3.2:3b',
  }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, forceAI } = await req.json()
    if (!prompt) return NextResponse.json({ error: 'prompt requis' }, { status: 400 })

    const decision = forceAI
      ? { ai: forceAI as AIChoice, reason: 'Choix manuel', taskType: 'manual' }
      : chooseAI(prompt)

    const t0 = Date.now()
    const data = decision.ai === 'claude'
      ? await callClaude(prompt)
      : decision.ai === 'chatgpt'
        ? await callChatGPT(prompt)
        : await callOllama(prompt)

    return NextResponse.json({
      ...data,
      ai: decision.ai,
      taskType: decision.taskType,
      routingReason: decision.reason,
      latencyMs: Date.now() - t0,
      savings: decision.ai === 'ollama' ? 0 : undefined,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur router'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
