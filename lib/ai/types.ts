// AI Router — core types (spec 139, Phase A)

export type AIProviderName = 'anthropic' | 'openai'

export type AICapability =
  | 'strategy'
  | 'copywriting'
  | 'quality_review'
  | 'vision_analysis'
  | 'image_generation'
  | 'image_editing'
  | 'data_analysis'
  | 'low_cost_draft'

export type AITaskType =
  | 'account_director'
  | 'social_copywriting'
  | 'quality_review'
  | 'vision_analysis'
  | 'visual_identity'
  | 'image_generation'
  | 'performance_analysis'
  | 'strategy_planning'
  | 'launch_advisor'
  | 'url_reading'

export type AIModelTier = 'premium' | 'standard' | 'economy'

export interface AIProviderModel {
  id: string
  tier: AIModelTier
  maxTokens: number
  capabilities: AICapability[]
  costPer1MInput: number
  costPer1MOutput: number
}

export interface AIProvider {
  name: AIProviderName
  configured: boolean
  envKeys: string[]
  models: AIProviderModel[]
  defaultModel: string
}

export interface AIRoutingContext {
  taskType: AITaskType
  clientBudget?: 'premium' | 'standard' | 'economy'
  requiresVision?: boolean
  requiresImageGeneration?: boolean
}

export interface AIRoutingDecision {
  provider: AIProviderName
  model: string
  tier: AIModelTier
  reason: string
  estimatedCostPer1MInput: number
  estimatedCostPer1MOutput: number
  fallback?: {
    provider: AIProviderName
    model: string
  }
}
