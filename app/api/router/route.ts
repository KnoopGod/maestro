import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { Ollama } from 'ollama'

// Mots-clés pour détection automatique de la tâche
const TASK_PATTERNS = {
  image:    /image|photo|visuel|bannière|logo|illustration|dalle|genère.*(image|visuel)/i,
  code:     /code|programme|fonction|script|bug|erreur|typescript|javascript|python|react/i,
  strategy: /stratégie|architecture|plan|analyse|vision|roadmap|objectif/i,
  simple:   /résume|reformule|hashtag|variante|brouillon|liste|traduis|courte?ment/i,
}

type AIChoice = 'claude' | 'chatgpt' | 'ollama'

interface RouteDecision {
  ai: AIChoice
  reason: string
  taskType: string
}

function detectTask(prompt: string): RouteDecision {
  if (TASK_PATTERNS.image.test(prompt)) {
    return { ai: 'chatgpt', reason: 'Tâche visuelle → ChatGPT', taskType: 'image' }
  }
  if (TASK_PATTERNS.code.test(prompt)) {
    return { ai: 'claude', reason: 'Tâche code → Claude', taskType: 'code' }
  }
  if (TASK_PATTERNS.strategy.test(prompt)) {
    return { ai: 'claude', reason: 'Tâche stratégique → Claude', taskType: 'strategy' }
  }
  if (TASK_PATTERNS.simple.test(prompt)) {
    return { ai: 'ollama', reason: 'Tâche légère → Ollama (gratuit)', taskType: 'simple' }
  }
  // Par défaut : Ollama pour économiser
  return { ai: 'ollama', reason: 'Tâche non classifiée → Ollama (économie)', taskType: 'general' }
}

async function callClaude(prompt: string): Promise<{ response: string; tokens: number; cost: number }> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const cost = (msg.usage.input_tokens * 3 + msg.usage.output_tokens * 15) / 1_000_000
  return { response: text, tokens: msg.usage.input_tokens + msg.usage.output_tokens, cost }
}

async function callChatGPT(prompt: string): Promise<{ response: string; tokens: number; cost: number }> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const completion = await client.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = completion.choices[0]?.message?.content ?? ''
  const i = completion.usage?.prompt_tokens ?? 0
  const o = completion.usage?.completion_tokens ?? 0
  const cost = (i * 2.5 + o * 10) / 1_000_000
  return { response: text, tokens: i + o, cost }
}

async function callOllama(prompt: string): Promise<{ response: string; tokens: number; cost: number }> {
  const ollama = new Ollama({ host: 'http://localhost:11434' })
  const res = await ollama.chat({
    model: 'llama3.2:3b',
    messages: [{ role: 'user', content: prompt }],
  })
  return { response: res.message.content, tokens: res.eval_count ?? 0, cost: 0 }
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, forceAI } = await req.json()

    if (!prompt) {
      return NextResponse.json({ error: 'prompt requis' }, { status: 400 })
    }

    const decision = forceAI
      ? { ai: forceAI as AIChoice, reason: 'Choix manuel', taskType: 'manual' }
      : detectTask(prompt)

    const t0 = Date.now()
    let result: { response: string; tokens: number; cost: number }

    try {
      if (decision.ai === 'claude' && process.env.ANTHROPIC_API_KEY) {
        result = await callClaude(prompt)
      } else if (decision.ai === 'chatgpt' && process.env.OPENAI_API_KEY) {
        result = await callChatGPT(prompt)
      } else {
        decision.ai = 'ollama'
        decision.reason += ' (Ollama — clé API non configurée)'
        result = await callOllama(prompt)
      }
    } catch (apiErr: unknown) {
      // Fallback Ollama si l'API distante échoue (crédits insuffisants, quota, timeout)
      const errMsg = apiErr instanceof Error ? apiErr.message : ''
      const wasAI = decision.ai
      decision.ai = 'ollama'
      decision.reason = `Fallback Ollama — ${wasAI} indisponible (${errMsg.slice(0, 60)})`
      result = await callOllama(prompt)
    }

    return NextResponse.json({
      ai: decision.ai,
      taskType: decision.taskType,
      routingReason: decision.reason,
      response: result.response,
      tokensUsed: result.tokens,
      cost: result.cost,
      latencyMs: Date.now() - t0,
      savings: decision.ai === 'ollama' ? parseFloat(((result.tokens * 9) / 1_000_000).toFixed(6)) : 0,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erreur router'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
