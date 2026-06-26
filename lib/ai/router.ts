import { AGENT_MODELS } from '@/lib/agents/config'
import { AI_PROVIDERS } from './providers'
import type { AICapability, AIProviderName, AIRoutingDecision, AITaskType } from './types'

interface TaskRoutingRule {
  capability: AICapability
  provider: AIProviderName
  modelKey: keyof typeof AGENT_MODELS
  reason: string
  costPer1M: { input: number; output: number }
}

const TASK_ROUTING: Record<AITaskType, TaskRoutingRule> = {
  account_director: {
    capability: 'strategy',
    provider: 'anthropic',
    modelKey: 'opus',
    reason: 'Strategic client analysis requires premium reasoning',
    costPer1M: { input: 15, output: 75 },
  },
  strategy_advisor: {
    capability: 'strategy',
    provider: 'anthropic',
    modelKey: 'opus',
    reason: 'Strategic advisory requires premium reasoning',
    costPer1M: { input: 15, output: 75 },
  },
  visual_identity: {
    capability: 'strategy',
    provider: 'anthropic',
    modelKey: 'opus',
    reason: 'Brand DA synthesis benefits from deep reasoning',
    costPer1M: { input: 15, output: 75 },
  },
  social_expert: {
    capability: 'copywriting',
    provider: 'anthropic',
    modelKey: 'sonnet',
    reason: 'Caption generation is balanced quality/cost on Sonnet',
    costPer1M: { input: 3, output: 15 },
  },
  supervisor: {
    capability: 'quality_review',
    provider: 'anthropic',
    modelKey: 'sonnet',
    reason: 'Quality review must never be low-cost; Sonnet is the floor',
    costPer1M: { input: 3, output: 15 },
  },
  performance_analyst: {
    capability: 'quality_review',
    provider: 'anthropic',
    modelKey: 'sonnet',
    reason: 'Performance analysis requires reliable structured output',
    costPer1M: { input: 3, output: 15 },
  },
  profit_controller: {
    capability: 'quality_review',
    provider: 'anthropic',
    modelKey: 'sonnet',
    reason: 'Financial decisions must never use low-cost models',
    costPer1M: { input: 3, output: 15 },
  },
  vision_analyzer: {
    capability: 'vision_analysis',
    provider: 'anthropic',
    modelKey: 'sonnet',
    reason: 'Vision analysis on Sonnet for reliable image understanding',
    costPer1M: { input: 3, output: 15 },
  },
  url_reader: {
    capability: 'low_cost_draft',
    provider: 'anthropic',
    modelKey: 'haiku',
    reason: 'URL reading is simple extraction — Haiku is sufficient',
    costPer1M: { input: 0.8, output: 4 },
  },
  image_generation: {
    capability: 'image_generation',
    provider: 'openai',
    modelKey: 'image',
    reason: 'Image generation uses OpenAI gpt-image-1',
    costPer1M: { input: 0, output: 0 },
  },
}

export function routeTask(taskType: AITaskType): AIRoutingDecision {
  const rule = TASK_ROUTING[taskType]
  const provider = AI_PROVIDERS[rule.provider]

  if (!provider.configured) {
    const fallbackProvider = rule.provider === 'anthropic' ? 'openai' : 'anthropic'
    const fallback = AI_PROVIDERS[fallbackProvider]

    if (fallback.configured) {
      return {
        provider: fallbackProvider,
        model: AGENT_MODELS[rule.modelKey],
        capability: rule.capability,
        reason: `Fallback: ${rule.provider} not configured`,
        estimatedCostPer1MTokens: rule.costPer1M,
      }
    }
  }

  return {
    provider: rule.provider,
    model: AGENT_MODELS[rule.modelKey],
    capability: rule.capability,
    reason: rule.reason,
    estimatedCostPer1MTokens: rule.costPer1M,
  }
}

export function getModelForTask(taskType: AITaskType): string {
  return routeTask(taskType).model
}

export function logRoutingDecision(taskType: AITaskType, decision: AIRoutingDecision): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[AI Router] ${taskType} → ${decision.provider}/${decision.model} (${decision.reason})`)
  }
}
