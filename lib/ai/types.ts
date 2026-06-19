export type AIProviderId =
  | 'anthropic'
  | 'openai'
  | 'gemini'
  | 'mistral'
  | 'groq'
  | 'ollama'
  | 'replicate'
  | 'ideogram'
  | 'luma'

export type AICapability =
  | 'strategy'
  | 'copywriting'
  | 'quality_review'
  | 'vision_analysis'
  | 'image_generation'
  | 'image_editing'
  | 'video_generation'
  | 'data_analysis'
  | 'document_summary'
  | 'low_cost_draft'
  | 'local_private_task'

export type AITaskType =
  | 'client_strategy'
  | 'social_caption'
  | 'post_supervision'
  | 'visual_identity'
  | 'image_generation'
  | 'image_editing'
  | 'video_generation'
  | 'performance_analysis'
  | 'document_summary'
  | 'low_cost_variation'

export type AIQualityTier = 'economy' | 'standard' | 'premium'
export type AIRiskLevel = 'low' | 'medium' | 'high'

export interface AIModelOption {
  id: string
  label: string
  quality: AIQualityTier
  speed: 'slow' | 'medium' | 'fast'
  estimatedInputCostPer1M?: number
  estimatedOutputCostPer1M?: number
  estimatedUnitCost?: number
  notes?: string
}

export interface AIProvider {
  id: AIProviderId
  name: string
  shortName: string
  category: 'text' | 'image' | 'video' | 'local'
  status: 'active' | 'planned'
  envVars: string[]
  capabilities: AICapability[]
  models: AIModelOption[]
  defaultModel: string
  fallbackModel?: string
  consoleUrl?: string
  bestFor: string[]
  limits: string[]
}

export interface AIProviderStatus extends AIProvider {
  configured: boolean
  missingEnvVars: string[]
}

export interface AIRoutingInput {
  taskType: AITaskType
  quality?: AIQualityTier
  risk?: AIRiskLevel
  maxEstimatedCostUsd?: number
  preferSpeed?: boolean
  allowUnconfigured?: boolean
}

export interface AIRoutingDecision {
  taskType: AITaskType
  provider: AIProviderId
  providerName: string
  model: string
  fallbackProvider?: AIProviderId
  fallbackModel?: string
  configured: boolean
  estimatedCostUsd: number | null
  reason: string
  warnings: string[]
}
