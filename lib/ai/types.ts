export type AIProviderName = 'anthropic' | 'openai'

export type AICapability =
  | 'strategy'
  | 'copywriting'
  | 'quality_review'
  | 'vision_analysis'
  | 'image_generation'
  | 'low_cost_draft'

export type AITaskType =
  | 'account_director'
  | 'social_expert'
  | 'supervisor'
  | 'vision_analyzer'
  | 'visual_identity'
  | 'image_generation'
  | 'url_reader'
  | 'strategy_advisor'
  | 'performance_analyst'
  | 'profit_controller'

export interface AIRoutingDecision {
  provider: AIProviderName
  model: string
  capability: AICapability
  reason: string
  estimatedCostPer1MTokens: { input: number; output: number }
}

export interface AIProviderInfo {
  name: AIProviderName
  configured: boolean
  capabilities: AICapability[]
  envVarsRequired: string[]
}
