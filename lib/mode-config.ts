import { ModeConfig, Mode, TaskCategory, AIProvider } from '@/types'

export const MODE_CONFIGS: ModeConfig[] = [
  {
    id: 'HYBRID',
    label: 'Mode Hybride',
    description: 'Le système choisit la meilleure IA pour chaque tâche',
    icon: '⚡',
    primaryAI: 'claude',
    routing: {
      strategy: 'claude', code: 'claude', image: 'chatgpt',
      video: 'chatgpt', writing: 'ollama', seo: 'claude',
      ads: 'claude', design: 'chatgpt', automation: 'claude', validation: 'claude',
    },
  },
  {
    id: 'CLAUDE_PREMIUM',
    label: 'Claude Premium',
    description: 'Claude prioritaire — meilleure qualité stratégique et code',
    icon: '👑',
    primaryAI: 'claude',
    routing: {
      strategy: 'claude', code: 'claude', image: 'chatgpt',
      video: 'chatgpt', writing: 'claude', seo: 'claude',
      ads: 'claude', design: 'claude', automation: 'claude', validation: 'claude',
    },
  },
  {
    id: 'CHATGPT_CREATIVE',
    label: 'ChatGPT Créatif',
    description: 'ChatGPT prioritaire — image, vidéo, création visuelle',
    icon: '🎨',
    primaryAI: 'chatgpt',
    routing: {
      strategy: 'claude', code: 'claude', image: 'chatgpt',
      video: 'chatgpt', writing: 'chatgpt', seo: 'chatgpt',
      ads: 'chatgpt', design: 'chatgpt', automation: 'claude', validation: 'claude',
    },
  },
  {
    id: 'OLLAMA_FREE',
    label: 'Ollama Gratuit',
    description: 'Maximum local — économie totale, zéro coût API',
    icon: '🏠',
    primaryAI: 'ollama',
    routing: {
      strategy: 'ollama', code: 'ollama', image: 'chatgpt',
      video: 'chatgpt', writing: 'ollama', seo: 'ollama',
      ads: 'ollama', design: 'chatgpt', automation: 'ollama', validation: 'ollama',
    },
  },
  {
    id: 'MAX_ECONOMY',
    label: 'Économie Max',
    description: 'Ollama pour tout, Claude/ChatGPT uniquement si critique',
    icon: '💰',
    primaryAI: 'ollama',
    routing: {
      strategy: 'ollama', code: 'ollama', image: 'chatgpt',
      video: 'chatgpt', writing: 'ollama', seo: 'ollama',
      ads: 'claude', design: 'chatgpt', automation: 'claude', validation: 'claude',
    },
  },
  {
    id: 'MAX_QUALITY',
    label: 'Qualité Max',
    description: 'Claude + ChatGPT partout — meilleur résultat possible',
    icon: '🏆',
    primaryAI: 'claude',
    routing: {
      strategy: 'claude', code: 'claude', image: 'chatgpt',
      video: 'chatgpt', writing: 'claude', seo: 'claude',
      ads: 'claude', design: 'chatgpt', automation: 'claude', validation: 'claude',
    },
  },
]

export function getAIForTask(category: TaskCategory, mode: Mode): AIProvider {
  const config = MODE_CONFIGS.find(m => m.id === mode)
  return config?.routing[category] ?? 'claude'
}

export function getModeConfig(mode: Mode): ModeConfig {
  return MODE_CONFIGS.find(m => m.id === mode) ?? MODE_CONFIGS[0]
}
