import { NextResponse } from 'next/server'
import { Ollama } from 'ollama'

const ollama = new Ollama({ host: 'http://localhost:11434' })

export async function GET() {
  const [ollamaStatus, claudeStatus] = await Promise.allSettled([
    ollama.list(),
    Promise.resolve(!!process.env.ANTHROPIC_API_KEY),
  ])

  const ollamaActive = ollamaStatus.status === 'fulfilled'
  const ollamaModels = ollamaActive
    ? (ollamaStatus.value as Awaited<ReturnType<typeof ollama.list>>).models.map((m: { name: string }) => m.name)
    : []

  const claudeConfigured = claudeStatus.status === 'fulfilled' && claudeStatus.value === true

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    services: {
      ollama: {
        status: ollamaActive ? 'active' : 'inactive',
        models: ollamaModels,
        host: 'localhost:11434',
      },
      claude: {
        status: claudeConfigured ? 'configured' : 'missing_key',
        model: 'claude-sonnet-4-6',
      },
      chatgpt: {
        status: process.env.OPENAI_API_KEY ? 'configured' : 'missing_key',
        model: 'gpt-4o',
      },
    },
  })
}
