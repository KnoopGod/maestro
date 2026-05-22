import { CostEstimate, AlertItem } from '@/types'

export const COST_ESTIMATES: CostEstimate[] = [
  { taskType: 'Architecture projet',     tokensInput: 2000, tokensOutput: 2000, costClaude: 0.18, costChatGPT: 0.15, costOllama: 0, optimizedCost: 0.18, savings: 0 },
  { taskType: 'Stratégie marketing',     tokensInput: 2500, tokensOutput: 2500, costClaude: 0.22, costChatGPT: 0.18, costOllama: 0, optimizedCost: 0.22, savings: 0 },
  { taskType: 'Résumés articles (×10)',  tokensInput: 5000, tokensOutput: 5000, costClaude: 0.45, costChatGPT: 0.38, costOllama: 0, optimizedCost: 0,    savings: 0.45 },
  { taskType: 'Hashtags (×200)',         tokensInput: 1000, tokensOutput: 1000, costClaude: 0.09, costChatGPT: 0.07, costOllama: 0, optimizedCost: 0,    savings: 0.09 },
  { taskType: 'Variantes posts (×30)',   tokensInput: 3000, tokensOutput: 3000, costClaude: 0.27, costChatGPT: 0.22, costOllama: 0, optimizedCost: 0,    savings: 0.27 },
  { taskType: 'Génération images (×6)',  tokensInput: 500,  tokensOutput: 500,  costClaude: 0,    costChatGPT: 0.24, costOllama: 0, optimizedCost: 0.24, savings: 0 },
  { taskType: 'Code complexe',           tokensInput: 3000, tokensOutput: 3000, costClaude: 0.27, costChatGPT: 0.22, costOllama: 0, optimizedCost: 0.27, savings: 0 },
  { taskType: 'Validation finale',       tokensInput: 2000, tokensOutput: 2000, costClaude: 0.18, costChatGPT: 0.15, costOllama: 0, optimizedCost: 0.18, savings: 0 },
]

export const MOCK_ALERTS: AlertItem[] = [
  {
    id: 'a1',
    type: 'warning',
    message: 'Claude : quota mensuel à 80% ($16.00 / $20.00)',
    ai: 'claude',
    timestamp: '14:52',
  },
  {
    id: 'a2',
    type: 'success',
    message: 'Ollama llama3.2 actif — prêt pour tâches légères',
    ai: 'ollama',
    timestamp: '09:00',
  },
  {
    id: 'a3',
    type: 'info',
    message: 'ChatGPT GPT-4o : nouvelle limite de vitesse détectée',
    ai: 'chatgpt',
    timestamp: '13:30',
  },
]

export const MONTHLY_STATS = {
  totalTokensUsed: 284500,
  totalTokensOptimized: 178200,
  savedTokens: 106300,
  totalCostWithoutOptimization: 12.80,
  totalCostOptimized: 7.22,
  totalSavings: 5.58,
  savingsPercent: 44,
  tasksByAI: {
    claude: 42,
    chatgpt: 18,
    ollama: 67,
  },
  costByAI: {
    claude: 6.48,
    chatgpt: 0.74,
    ollama: 0,
  },
}
