// AI Router — cost calculation helpers (spec 139, Phase A)

import type { AIModelTier, AIRoutingDecision } from './types'
import { getProvider } from './providers'

export function calcRoutingCost(
  decision: AIRoutingDecision,
  inputTokens: number,
  outputTokens: number
): number {
  const cost =
    (inputTokens * decision.estimatedCostPer1MInput +
      outputTokens * decision.estimatedCostPer1MOutput) /
    1_000_000
  return parseFloat(cost.toFixed(6))
}

// Backward-compatible helper used by legacy agents via lib/agents/config.ts
export function calcCostByTier(
  tier: AIModelTier,
  inputTokens: number,
  outputTokens: number
): number {
  const PRICING: Record<AIModelTier, { input: number; output: number }> = {
    premium: { input: 5, output: 25 },
    standard: { input: 3, output: 15 },
    economy: { input: 1, output: 5 },
  }
  const p = PRICING[tier]
  return parseFloat(
    ((inputTokens * p.input + outputTokens * p.output) / 1_000_000).toFixed(6)
  )
}

export function estimateCostForModel(
  providerName: 'anthropic' | 'openai',
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const provider = getProvider(providerName)
  const model = provider.models.find((m) => m.id === modelId)
  if (!model) return 0
  return parseFloat(
    ((inputTokens * model.costPer1MInput + outputTokens * model.costPer1MOutput) /
      1_000_000).toFixed(6)
  )
}
