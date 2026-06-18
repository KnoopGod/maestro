import type { ClientBusinessProfile, ClientStrategy, ClientType } from '@/types/client'
import { getPlaybookForLegacyType, getPlaybook } from '@/lib/playbooks'

const sharedAvoid = ['contenu générique', 'promesses exagérées', 'ton robotique']

interface StrategyInput {
  type: ClientType
  name: string
  city: string
  positioning: string
  tone: string
  offerFocus: string
  businessProfile?: ClientBusinessProfile | null
}

export function createClientStrategy(input: StrategyInput): ClientStrategy {
  const playbook = input.businessProfile?.vertical
    ? getPlaybook(input.businessProfile.vertical)
    : getPlaybookForLegacyType(input.type)
  const defaults = playbook.strategy
  const context = [
    input.positioning.trim() ? `Positionnement : ${input.positioning.trim()}.` : '',
    input.offerFocus.trim() ? `Offre prioritaire : ${input.offerFocus.trim()}.` : '',
    input.tone.trim() ? `Ton à privilégier : ${input.tone.trim()}.` : '',
    input.businessProfile?.priorityObjective ? `Objectif business prioritaire : ${input.businessProfile.priorityObjective}.` : '',
  ].filter(Boolean)

  return {
    objective: [
      `Développer la visibilité locale de ${input.name}${input.city.trim() ? ` à ${input.city.trim()}` : ''} et transformer l'intérêt digital en actions commerciales mesurables.`,
      ...context,
    ].join(' '),
    contentPillars: defaults.contentPillars,
    platforms: ['instagram', 'facebook'],
    frequency: defaults.frequency,
    bestTimes: defaults.bestTimes,
    avoid: [...new Set([...sharedAvoid, ...defaults.avoid])],
  }
}
