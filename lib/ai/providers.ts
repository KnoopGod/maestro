// AI Router — provider registry (spec 139, Phase A)
// Add new providers here as they become active in the system.

import type { AIProvider, AIProviderName } from './types'

const ANTHROPIC_PROVIDER: AIProvider = {
  name: 'anthropic',
  configured: !!(
    process.env.ANTHROPIC_API_KEY ||
    process.env.ANTHROPIC_OPUS_MODEL ||
    process.env.ANTHROPIC_SONNET_MODEL
  ),
  envKeys: ['ANTHROPIC_API_KEY'],
  defaultModel: process.env.ANTHROPIC_SONNET_MODEL ?? 'claude-sonnet-4-6',
  models: [
    {
      id: process.env.ANTHROPIC_OPUS_MODEL ?? 'claude-opus-4-7',
      tier: 'premium',
      maxTokens: 32000,
      capabilities: ['strategy', 'copywriting', 'quality_review', 'data_analysis'],
      costPer1MInput: 5,
      costPer1MOutput: 25,
    },
    {
      id: process.env.ANTHROPIC_SONNET_MODEL ?? 'claude-sonnet-4-6',
      tier: 'standard',
      maxTokens: 16000,
      capabilities: ['copywriting', 'vision_analysis', 'data_analysis', 'quality_review'],
      costPer1MInput: 3,
      costPer1MOutput: 15,
    },
    {
      id: process.env.ANTHROPIC_HAIKU_MODEL ?? 'claude-haiku-4-5',
      tier: 'economy',
      maxTokens: 8000,
      capabilities: ['low_cost_draft'],
      costPer1MInput: 1,
      costPer1MOutput: 5,
    },
  ],
}

const OPENAI_PROVIDER: AIProvider = {
  name: 'openai',
  configured: !!process.env.OPENAI_API_KEY,
  envKeys: ['OPENAI_API_KEY'],
  defaultModel: process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1',
  models: [
    {
      id: process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1',
      tier: 'standard',
      maxTokens: 0,
      capabilities: ['image_generation', 'image_editing'],
      costPer1MInput: 0,
      costPer1MOutput: 0,
    },
  ],
}

const PROVIDER_REGISTRY: Record<AIProviderName, AIProvider> = {
  anthropic: ANTHROPIC_PROVIDER,
  openai: OPENAI_PROVIDER,
}

export function getProvider(name: AIProviderName): AIProvider {
  return PROVIDER_REGISTRY[name]
}

export function getConfiguredProviders(): AIProvider[] {
  return Object.values(PROVIDER_REGISTRY).filter((p) => p.configured)
}

export function getAllProviders(): AIProvider[] {
  return Object.values(PROVIDER_REGISTRY)
}

export function isProviderConfigured(name: AIProviderName): boolean {
  return PROVIDER_REGISTRY[name]?.configured ?? false
}
