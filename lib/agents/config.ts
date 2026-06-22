export const AGENT_MODELS = {
  opus: process.env.ANTHROPIC_OPUS_MODEL ?? 'claude-opus-4-7',
  sonnet: process.env.ANTHROPIC_SONNET_MODEL ?? 'claude-sonnet-4-6',
  haiku: process.env.ANTHROPIC_HAIKU_MODEL ?? 'claude-haiku-4-5',
  image: process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1',
} as const

export type AgentModelTier = 'opus' | 'sonnet' | 'haiku'

const PRICING_PER_1M_TOKENS: Record<AgentModelTier, { input: number; output: number }> = {
  opus: { input: 5, output: 25 },
  sonnet: { input: 3, output: 15 },
  haiku: { input: 1, output: 5 },
}

export function calcCost(tier: AgentModelTier, inputTokens: number, outputTokens: number): number {
  const pricing = PRICING_PER_1M_TOKENS[tier]
  return parseFloat(((inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000).toFixed(6))
}
