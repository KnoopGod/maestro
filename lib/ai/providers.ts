import type { AIProvider, AIProviderConfig } from './types'
import { AGENT_MODELS } from '@/lib/agents/config'

export const AI_PROVIDERS: Record<AIProvider, AIProviderConfig> = {
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    configured: Boolean(process.env.ANTHROPIC_API_KEY),
    envKeys: ['ANTHROPIC_API_KEY'],
    capabilities: [
      'strategy',
      'copywriting',
      'quality_review',
      'vision_analysis',
      'data_analysis',
      'low_cost_draft',
    ],
    models: [
      {
        id: AGENT_MODELS.opus,
        name: 'Claude Opus',
        tier: 'premium',
        provider: 'anthropic',
        costPer1MInputTokens: 15,
        costPer1MOutputTokens: 75,
        supportsVision: true,
      },
      {
        id: AGENT_MODELS.sonnet,
        name: 'Claude Sonnet',
        tier: 'standard',
        provider: 'anthropic',
        costPer1MInputTokens: 3,
        costPer1MOutputTokens: 15,
        supportsVision: true,
      },
      {
        id: AGENT_MODELS.haiku,
        name: 'Claude Haiku',
        tier: 'efficient',
        provider: 'anthropic',
        costPer1MInputTokens: 0.8,
        costPer1MOutputTokens: 4,
        supportsVision: true,
      },
    ],
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    configured: Boolean(process.env.OPENAI_API_KEY),
    envKeys: ['OPENAI_API_KEY'],
    capabilities: ['image_generation', 'image_editing', 'low_cost_draft'],
    models: [
      {
        id: AGENT_MODELS.image,
        name: 'GPT Image 1',
        tier: 'standard',
        provider: 'openai',
        costPer1MInputTokens: 0,
        costPer1MOutputTokens: 0,
        supportsVision: false,
      },
    ],
  },
}

export function isProviderConfigured(provider: AIProvider): boolean {
  return AI_PROVIDERS[provider].configured
}

export function getConfiguredProviders(): AIProvider[] {
  return (Object.keys(AI_PROVIDERS) as AIProvider[]).filter(isProviderConfigured)
}
