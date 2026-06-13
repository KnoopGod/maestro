import { NextResponse } from 'next/server'
import { Ollama } from 'ollama'

const ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://localhost:11434' })

export async function GET() {
  const ollamaStatus = await ollama.list().catch(() => null)
  const ollamaModels = ollamaStatus?.models?.map((model: { name: string }) => model.name) ?? []

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    services: {
      ollama: {
        status: ollamaStatus ? 'active' : 'inactive',
        models: ollamaModels,
        host: process.env.OLLAMA_HOST || 'localhost:11434',
      },
      claude: {
        status: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing_key',
        model: 'claude-sonnet-4-6',
      },
      chatgpt: {
        status: process.env.OPENAI_API_KEY ? 'configured' : 'missing_key',
        model: 'gpt-4o',
      },
    },
  })
}
