import type {
  AICapability,
  AIRoutingContext,
  AIRoutingDecision,
  ModelTier,
} from './types'
import { AI_PROVIDERS } from './providers'
import { AGENT_MODELS } from '@/lib/agents/config'

// Average token count per call type — used for cost estimation
const ESTIMATED_TOKENS: Record<string, { input: number; output: number }> = {
  client_strategy: { input: 2500, output: 800 },
  caption_generation: { input: 1500, output: 600 },
  quality_control: { input: 2000, output: 400 },
  visual_analysis: { input: 1200, output: 300 },
  art_direction: { input: 1800, output: 600 },
  image_generation: { input: 0, output: 0 },
  performance_analysis: { input: 3000, output: 800 },
  content_planning: { input: 2000, output: 1000 },
  launch_advice: { input: 1500, output: 500 },
  impact_scoring: { input: 800, output: 200 },
  profit_control: { input: 1000, output: 300 },
  low_cost_task: { input: 500, output: 200 },
}

interface TaskRule {
  capability: AICapability
  defaultTier: ModelTier
  never_cheap: boolean
  requires_vision: boolean
}

// Maps each Maestro task to its routing requirements
const TASK_RULES: Record<string, TaskRule> = {
  client_strategy: {
    capability: 'strategy',
    defaultTier: 'premium',
    never_cheap: true,
    requires_vision: false,
  },
  caption_generation: {
    capability: 'copywriting',
    defaultTier: 'premium',
    never_cheap: false,
    requires_vision: false,
  },
  quality_control: {
    capability: 'quality_review',
    defaultTier: 'premium',
    never_cheap: true,
    requires_vision: false,
  },
  visual_analysis: {
    capability: 'vision_analysis',
    defaultTier: 'standard',
    never_cheap: false,
    requires_vision: true,
  },
  art_direction: {
    capability: 'strategy',
    defaultTier: 'premium',
    never_cheap: true,
    requires_vision: false,
  },
  image_generation: {
    capability: 'image_generation',
    defaultTier: 'standard',
    never_cheap: false,
    requires_vision: false,
  },
  performance_analysis: {
    capability: 'data_analysis',
    defaultTier: 'premium',
    never_cheap: false,
    requires_vision: false,
  },
  content_planning: {
    capability: 'strategy',
    defaultTier: 'premium',
    never_cheap: false,
    requires_vision: false,
  },
  launch_advice: {
    capability: 'strategy',
    defaultTier: 'premium',
    never_cheap: true,
    requires_vision: false,
  },
  impact_scoring: {
    capability: 'data_analysis',
    defaultTier: 'standard',
    never_cheap: false,
    requires_vision: false,
  },
  profit_control: {
    capability: 'data_analysis',
    defaultTier: 'standard',
    never_cheap: false,
    requires_vision: false,
  },
  low_cost_task: {
    capability: 'low_cost_draft',
    defaultTier: 'efficient',
    never_cheap: false,
    requires_vision: false,
  },
}

function estimateCost(
  model: string,
  taskType: string
): number {
  const tokens = ESTIMATED_TOKENS[taskType] ?? { input: 1000, output: 300 }
  const anthropicConfig = AI_PROVIDERS.anthropic
  const found = anthropicConfig.models.find((m) => m.id === model)
  if (!found || (tokens.input === 0 && tokens.output === 0)) return 0
  return parseFloat(
    (
      (tokens.input * found.costPer1MInputTokens +
        tokens.output * found.costPer1MOutputTokens) /
      1_000_000
    ).toFixed(6)
  )
}

/**
 * Route a Maestro AI task to the best available provider and model.
 *
 * Rules (in priority order):
 * 1. Image generation → always OpenAI gpt-image-1
 * 2. never_cheap tasks → always Opus regardless of preferCheap
 * 3. preferCheap + not never_cheap → Haiku (with Sonnet fallback)
 * 4. premium client → Opus
 * 5. default → Opus (primary reasoning model for HORECA quality)
 */
export function routeTask(ctx: AIRoutingContext): AIRoutingDecision {
  const rule = TASK_RULES[ctx.task] ?? TASK_RULES.low_cost_task

  // Image generation is always handled by OpenAI
  if (rule.capability === 'image_generation') {
    return {
      provider: 'openai',
      model: AGENT_MODELS.image,
      tier: 'standard',
      capability: 'image_generation',
      reason: 'Image generation routes to OpenAI gpt-image-1',
      estimatedCostPerCall: 0,
      fallback: {
        provider: 'openai',
        model: AGENT_MODELS.image,
        tier: 'standard',
      },
    }
  }

  // Tasks that must never use a cheap model (validation, strategy, final review)
  if (rule.never_cheap) {
    const model = AGENT_MODELS.opus
    return {
      provider: 'anthropic',
      model,
      tier: 'premium',
      capability: rule.capability,
      reason: `${ctx.task} requires premium quality — never routed to cost-optimised models`,
      estimatedCostPerCall: estimateCost(model, ctx.task),
      fallback: {
        provider: 'anthropic',
        model: AGENT_MODELS.sonnet,
        tier: 'standard',
      },
    }
  }

  // Cost-optimised path (opt-in, skipped for never_cheap tasks)
  if (ctx.preferCheap) {
    const model = AGENT_MODELS.haiku
    return {
      provider: 'anthropic',
      model,
      tier: 'efficient',
      capability: rule.capability,
      reason: `${ctx.task} routed to Haiku — cost optimisation requested`,
      estimatedCostPerCall: estimateCost(model, ctx.task),
      fallback: {
        provider: 'anthropic',
        model: AGENT_MODELS.sonnet,
        tier: 'standard',
      },
    }
  }

  // Premium client preference → Opus
  if (ctx.clientTier === 'premium') {
    const model = AGENT_MODELS.opus
    return {
      provider: 'anthropic',
      model,
      tier: 'premium',
      capability: rule.capability,
      reason: `${ctx.task} routed to Opus — premium client tier`,
      estimatedCostPerCall: estimateCost(model, ctx.task),
      fallback: {
        provider: 'anthropic',
        model: AGENT_MODELS.sonnet,
        tier: 'standard',
      },
    }
  }

  // Default: use the task's configured default tier
  const tierModel: Record<ModelTier, string> = {
    premium: AGENT_MODELS.opus,
    standard: AGENT_MODELS.sonnet,
    efficient: AGENT_MODELS.haiku,
  }
  const model = tierModel[rule.defaultTier]

  return {
    provider: 'anthropic',
    model,
    tier: rule.defaultTier,
    capability: rule.capability,
    reason: `${ctx.task} — default routing to ${rule.defaultTier} tier`,
    estimatedCostPerCall: estimateCost(model, ctx.task),
    fallback: {
      provider: 'anthropic',
      model: rule.defaultTier === 'premium' ? AGENT_MODELS.sonnet : AGENT_MODELS.opus,
      tier: rule.defaultTier === 'premium' ? 'standard' : 'premium',
    },
  }
}

/**
 * Log a routing decision to the console for observability.
 * In production this can be wired to the agent_events table or an external sink.
 */
export function logRoutingDecision(
  decision: AIRoutingDecision,
  taskType: string
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `[AI Router] ${taskType} → ${decision.provider}/${decision.model} ` +
        `(${decision.tier}) | reason: ${decision.reason} | ` +
        `~$${decision.estimatedCostPerCall}/call`
    )
  }
}
