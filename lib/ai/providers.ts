import type { AIProviderInfo, AIProviderName } from './types'

const ANTHROPIC_CAPABILITIES = [
  'strategy',
  'copywriting',
  'quality_review',
  'vision_analysis',
  'low_cost_draft',
] as const

const OPENAI_CAPABILITIES = ['image_generation'] as const

function isConfigured(envVars: string[]): boolean {
  return envVars.every((v) => !!process.env[v])
}

export const AI_PROVIDERS: Record<AIProviderName, AIProviderInfo> = {
  anthropic: {
    name: 'anthropic',
    configured: isConfigured(['ANTHROPIC_API_KEY']),
    capabilities: [...ANTHROPIC_CAPABILITIES],
    envVarsRequired: ['ANTHROPIC_API_KEY'],
  },
  openai: {
    name: 'openai',
    configured: isConfigured(['OPENAI_API_KEY']),
    capabilities: [...OPENAI_CAPABILITIES],
    envVarsRequired: ['OPENAI_API_KEY'],
  },
}

export function getProviderStatus(): AIProviderInfo[] {
  return Object.values(AI_PROVIDERS)
}
