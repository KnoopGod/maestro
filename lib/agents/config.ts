export const AGENT_MODELS = {
  opus:   'claude-opus-4-8',
  sonnet: 'claude-sonnet-4-6',
  haiku:  'claude-haiku-4-5',
  image:  (process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1') as string,
} as const

export type AgentModelTier = 'opus' | 'sonnet' | 'haiku'

const PRICING: Record<AgentModelTier, { input: number; output: number }> = {
  opus:   { input: 5,  output: 25 },
  sonnet: { input: 3,  output: 15 },
  haiku:  { input: 1,  output: 5  },
}

export function calcCost(tier: AgentModelTier, inputTokens: number, outputTokens: number): number {
  const p = PRICING[tier]
  return parseFloat(((inputTokens * p.input + outputTokens * p.output) / 1_000_000).toFixed(6))
}
