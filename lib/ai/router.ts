// AI Router — routing logic (spec 139, Phase A)
// Routes MAESTRO task types to the best available provider+model.
// Rules: strategic/critical tasks → premium; simple drafts → economy;
// vision tasks → Anthropic Sonnet; image generation → OpenAI.
// A missing API key causes fallback to the next configured provider.

import type { AIRoutingContext, AIRoutingDecision } from './types'
import { getProvider, isProviderConfigured } from './providers'

const ANTHROPIC_PREMIUM = getProvider('anthropic').models.find((m) => m.tier === 'premium')!
const ANTHROPIC_STANDARD = getProvider('anthropic').models.find((m) => m.tier === 'standard')!
const ANTHROPIC_ECONOMY = getProvider('anthropic').models.find((m) => m.tier === 'economy')!
const OPENAI_IMAGE = getProvider('openai').models.find((m) => m.capabilities.includes('image_generation'))!

export function routeTask(ctx: AIRoutingContext): AIRoutingDecision {
  // Image generation always goes to OpenAI
  if (ctx.requiresImageGeneration || ctx.taskType === 'image_generation') {
    return {
      provider: 'openai',
      model: OPENAI_IMAGE.id,
      tier: OPENAI_IMAGE.tier,
      reason: 'Image generation routed to OpenAI gpt-image-1',
      estimatedCostPer1MInput: OPENAI_IMAGE.costPer1MInput,
      estimatedCostPer1MOutput: OPENAI_IMAGE.costPer1MOutput,
      fallback: isProviderConfigured('anthropic')
        ? { provider: 'anthropic', model: ANTHROPIC_STANDARD.id }
        : undefined,
    }
  }

  // Vision analysis uses Sonnet (has vision capability)
  if (ctx.requiresVision || ctx.taskType === 'vision_analysis') {
    return {
      provider: 'anthropic',
      model: ANTHROPIC_STANDARD.id,
      tier: 'standard',
      reason: 'Vision analysis requires Anthropic Claude with vision capability',
      estimatedCostPer1MInput: ANTHROPIC_STANDARD.costPer1MInput,
      estimatedCostPer1MOutput: ANTHROPIC_STANDARD.costPer1MOutput,
    }
  }

  // Economy tasks: url_reading, low-cost drafts
  if (ctx.taskType === 'url_reading') {
    return {
      provider: 'anthropic',
      model: ANTHROPIC_ECONOMY.id,
      tier: 'economy',
      reason: 'URL reading is a lightweight task — economy model sufficient',
      estimatedCostPer1MInput: ANTHROPIC_ECONOMY.costPer1MInput,
      estimatedCostPer1MOutput: ANTHROPIC_ECONOMY.costPer1MOutput,
      fallback: { provider: 'anthropic', model: ANTHROPIC_STANDARD.id },
    }
  }

  // Premium tasks: strategy, quality review, visual identity, performance analysis
  const premiumTasks: AIRoutingContext['taskType'][] = [
    'account_director',
    'quality_review',
    'visual_identity',
    'performance_analysis',
    'strategy_planning',
    'launch_advisor',
  ]
  if (premiumTasks.includes(ctx.taskType) || ctx.clientBudget === 'premium') {
    return {
      provider: 'anthropic',
      model: ANTHROPIC_PREMIUM.id,
      tier: 'premium',
      reason: `Task "${ctx.taskType}" requires premium reasoning — routed to Claude Opus`,
      estimatedCostPer1MInput: ANTHROPIC_PREMIUM.costPer1MInput,
      estimatedCostPer1MOutput: ANTHROPIC_PREMIUM.costPer1MOutput,
      fallback: { provider: 'anthropic', model: ANTHROPIC_STANDARD.id },
    }
  }

  // Default: social copywriting and other tasks → standard
  return {
    provider: 'anthropic',
    model: ANTHROPIC_STANDARD.id,
    tier: 'standard',
    reason: `Task "${ctx.taskType}" routed to Claude Sonnet (standard)`,
    estimatedCostPer1MInput: ANTHROPIC_STANDARD.costPer1MInput,
    estimatedCostPer1MOutput: ANTHROPIC_STANDARD.costPer1MOutput,
    fallback: { provider: 'anthropic', model: ANTHROPIC_ECONOMY.id },
  }
}

// Log a routing decision to the console in dev — no-op in production
export function logRoutingDecision(
  decision: AIRoutingDecision,
  inputTokens?: number,
  outputTokens?: number
): void {
  if (process.env.NODE_ENV !== 'development') return
  const cost =
    inputTokens !== undefined && outputTokens !== undefined
      ? ` | cost=$${(
          (inputTokens * decision.estimatedCostPer1MInput +
            outputTokens * decision.estimatedCostPer1MOutput) /
          1_000_000
        ).toFixed(6)}`
      : ''
  console.log(
    `[AI Router] ${decision.provider}/${decision.model} (${decision.tier}) — ${decision.reason}${cost}`
  )
}
