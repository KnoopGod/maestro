export type AIProvider = 'claude' | 'chatgpt' | 'ollama' | 'future'

export type AIStatus = 'active' | 'limited' | 'timeout' | 'inactive'

export type Badge = 'premium' | 'creative' | 'local' | 'free' | 'draft' | 'future'

export type Mode =
  | 'CLAUDE_PREMIUM'
  | 'CHATGPT_CREATIVE'
  | 'OLLAMA_FREE'
  | 'HYBRID'
  | 'MAX_ECONOMY'
  | 'MAX_QUALITY'

export type TaskCategory =
  | 'strategy'
  | 'code'
  | 'image'
  | 'video'
  | 'writing'
  | 'seo'
  | 'ads'
  | 'design'
  | 'automation'
  | 'validation'

export type RiskLevel = 'low' | 'medium' | 'high'

export interface AIModel {
  id: AIProvider
  name: string
  provider: string
  currentModel: string
  status: AIStatus
  badge: Badge
  color: string
  bgColor: string
  borderColor: string
  qualityScore: number    // 0-100
  speedScore: number      // 0-100
  costScore: number       // 0-100 (100 = free)
  useCases: string[]
  monthlyBudget?: number
  usedBudget?: number
  description: string
}

export interface Task {
  id: string
  label: string
  category: TaskCategory
  recommendedAI: AIProvider
  fallbackAI: AIProvider
  reason: string
  quality: number         // 1-5
  speed: number           // 1-5
  cost: '$' | '$$' | '$$$' | '$$$$' | 'FREE'
  risk: RiskLevel
  estimatedTokens: number
}

export interface WorkStep {
  id: string
  ai: AIProvider
  action: string
  promptSummary: string
  outputSummary: string
  timestamp: string
  tokensUsed: number
  status: 'completed' | 'in_progress' | 'failed'
}

export interface WorkSession {
  id: string
  date: string
  mission: string
  project: string
  steps: WorkStep[]
  aiSequence: AIProvider[]
  status: 'active' | 'paused' | 'completed'
  summary: string
  nextAction: string
  tokensUsed: number
  estimatedCost: number
  savings: number
}

export interface ModeConfig {
  id: Mode
  label: string
  description: string
  icon: string
  routing: Record<TaskCategory, AIProvider>
  primaryAI: AIProvider
}

export interface CostEstimate {
  taskType: string
  tokensInput: number
  tokensOutput: number
  costClaude: number
  costChatGPT: number
  costOllama: number
  optimizedCost: number
  savings: number
}

export interface AlertItem {
  id: string
  type: 'warning' | 'error' | 'info' | 'success'
  message: string
  ai?: AIProvider
  timestamp: string
}
