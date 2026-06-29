import { AI_PROVIDERS, getAIProviderStatuses } from './providers'
import type { AIProviderId, AIRoutingDecision, AIRoutingInput, AITaskType } from './types'

interface TaskRule {
  preferred: AIProviderId
  fallback?: AIProviderId
  estimatedCostUsd: number | null
  reason: string
  highRiskLocked?: boolean
}

const TASK_RULES: Record<AITaskType, TaskRule> = {
  client_strategy: {
    preferred: 'anthropic',
    fallback: 'gemini',
    estimatedCostUsd: 0.006,
    reason: 'Stratégie client : qualité et raisonnement prioritaire. Claude reste le meilleur choix par défaut.',
    highRiskLocked: true,
  },
  social_caption: {
    preferred: 'anthropic',
    fallback: 'openai',
    estimatedCostUsd: 0.004,
    reason: 'Caption social : besoin de cohérence marque, CTA et adaptation plateforme.',
  },
  post_supervision: {
    preferred: 'anthropic',
    fallback: 'openai',
    estimatedCostUsd: 0.003,
    reason: 'Validation finale : ne pas router vers un modèle low-cost, car le risque réputationnel est élevé.',
    highRiskLocked: true,
  },
  visual_identity: {
    preferred: 'anthropic',
    fallback: 'gemini',
    estimatedCostUsd: 0.004,
    reason: 'Analyse DA : besoin vision + synthèse fiable pour guider les prochains visuels.',
  },
  image_generation: {
    preferred: 'openai',
    fallback: 'replicate',
    estimatedCostUsd: 0.04,
    reason: 'Image : OpenAI est le provider actif le plus fiable actuellement pour le pipeline Studio.',
  },
  image_editing: {
    preferred: 'openai',
    fallback: 'replicate',
    estimatedCostUsd: 0.04,
    reason: 'Édition image : priorité à un provider multimodal stable avant d’ajouter Replicate/Firefly.',
  },
  video_generation: {
    preferred: 'luma',
    fallback: 'replicate',
    estimatedCostUsd: 0.35,
    reason: 'Vidéo/Reel : Luma est déjà prévu dans l’app et doit être contrôlé par le budget client.',
  },
  performance_analysis: {
    preferred: 'anthropic',
    fallback: 'openai',
    estimatedCostUsd: 0.003,
    reason: 'Performance : interprétation business, pas seulement résumé de chiffres.',
  },
  document_summary: {
    preferred: 'anthropic',
    fallback: 'gemini',
    estimatedCostUsd: 0.004,
    reason: 'Documents client : Claude par défaut, Gemini plus tard pour contexte long.',
  },
  low_cost_variation: {
    preferred: 'groq',
    fallback: 'openai',
    estimatedCostUsd: 0.001,
    reason: 'Variantes simples : futur candidat low-cost/rapide. OpenAI ou Claude restent fallback tant que Groq n’est pas branché.',
  },
}

export function routeAITask(input: AIRoutingInput): AIRoutingDecision {
  const statuses = getAIProviderStatuses()
  const rule = TASK_RULES[input.taskType]
  const preferred = statuses.find(provider => provider.id === rule.preferred)
  const fallback = rule.fallback ? statuses.find(provider => provider.id === rule.fallback) : undefined
  const warnings: string[] = []

  if (input.risk === 'high' && rule.highRiskLocked && preferred?.category !== 'text') {
    warnings.push('Mission critique : le routeur conserve un modèle premium de supervision.')
  }

  if (input.maxEstimatedCostUsd != null && rule.estimatedCostUsd != null && rule.estimatedCostUsd > input.maxEstimatedCostUsd) {
    warnings.push(`Coût estimé supérieur au plafond demandé (${formatUsd(rule.estimatedCostUsd)} > ${formatUsd(input.maxEstimatedCostUsd)}).`)
  }

  const provider = preferred?.configured || input.allowUnconfigured
    ? preferred
    : fallback?.configured
      ? fallback
      : preferred

  if (!provider) {
    return {
      taskType: input.taskType,
      provider: rule.preferred,
      providerName: rule.preferred,
      model: 'unavailable',
      fallbackProvider: rule.fallback,
      fallbackModel: undefined,
      configured: false,
      estimatedCostUsd: rule.estimatedCostUsd,
      reason: rule.reason,
      warnings: ['Aucun provider connu pour cette tâche.'],
    }
  }

  if (!provider.configured) {
    warnings.push(`Provider non configuré : ajouter ${provider.missingEnvVars.join(', ')}.`)
  }
  if (provider.id !== rule.preferred) {
    warnings.push(`Fallback utilisé car ${rule.preferred} n’est pas configuré.`)
  }

  const model = selectModel(provider.id, input)

  return {
    taskType: input.taskType,
    provider: provider.id,
    providerName: provider.name,
    model,
    fallbackProvider: fallback?.id,
    fallbackModel: fallback?.defaultModel,
    configured: provider.configured,
    estimatedCostUsd: rule.estimatedCostUsd,
    reason: rule.reason,
    warnings,
  }
}

export function listRoutingPreview(): AIRoutingDecision[] {
  return (Object.keys(TASK_RULES) as AITaskType[]).map(taskType => routeAITask({ taskType }))
}

function selectModel(providerId: AIProviderId, input: AIRoutingInput) {
  const provider = AI_PROVIDERS.find(item => item.id === providerId)
  if (!provider) return 'unknown'

  if (input.quality === 'economy' || input.preferSpeed) {
    const economy = provider.models.find(model => model.quality === 'economy')
    if (economy) return economy.id
  }

  if (input.quality === 'premium') {
    const premium = provider.models.find(model => model.quality === 'premium')
    if (premium) return premium.id
  }

  return provider.defaultModel
}

function formatUsd(value: number) {
  return `$${value.toFixed(value < 0.01 ? 4 : 2)}`
}
