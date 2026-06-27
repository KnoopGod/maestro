export type AIProvider = 'anthropic' | 'openai'

export type AICapability =
  | 'strategy'
  | 'copywriting'
  | 'quality_review'
  | 'vision_analysis'
  | 'image_generation'
  | 'image_editing'
  | 'video_generation'
  | 'data_analysis'
  | 'low_cost_draft'
  | 'local_private_task'

export type AITaskType =
  | 'client_strategy'       // Account Director
  | 'caption_generation'    // Social Expert
  | 'quality_control'       // Supervisor
  | 'visual_analysis'       // Vision Analyzer
  | 'art_direction'         // Visual Identity
  | 'image_generation'      // Image Generator
  | 'performance_analysis'  // Performance Analyst
  | 'content_planning'      // Planner
  | 'launch_advice'         // Launch Advisor
  | 'impact_scoring'        // Impact Scorer
  | 'profit_control'        // Profit Controller
  | 'low_cost_task'         // Simple or repetitive tasks

export type ModelTier = 'premium' | 'standard' | 'efficient'

export interface AIModelConfig {
  id: string
  name: string
  tier: ModelTier
  provider: AIProvider
  costPer1MInputTokens: number
  costPer1MOutputTokens: number
  supportsVision: boolean
}

export interface AIProviderConfig {
  id: AIProvider
  name: string
  configured: boolean
  envKeys: string[]
  capabilities: AICapability[]
  models: AIModelConfig[]
}

export interface AIRoutingDecision {
  provider: AIProvider
  model: string
  tier: ModelTier
  capability: AICapability
  reason: string
  estimatedCostPerCall: number
  fallback: {
    provider: AIProvider
    model: string
    tier: ModelTier
  }
}

export interface AIRoutingContext {
  task: AITaskType
  preferCheap?: boolean
  requiresVision?: boolean
  clientTier?: 'premium' | 'standard'
}
