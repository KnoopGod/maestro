import type { VerticalPlaybook } from './types'
import { restaurant } from './restaurant'
import { hotel } from './hotel'
import { bnb } from './bnb'
import { bar } from './bar'
import { coiffeur } from './coiffeur'
import { salleDesSport } from './salle-de-sport'
import { padel } from './padel'
import { commerceLocal } from './commerce-local'
import { defaultPlaybook } from './default'

const REGISTRY: VerticalPlaybook[] = [
  restaurant, hotel, bnb, bar,
  coiffeur, salleDesSport, padel, commerceLocal,
]

export { type VerticalPlaybook }
export type { BusinessObjective, ConversionChannel, CampaignTemplate } from './types'
export { BUSINESS_OBJECTIVE_LABELS } from './types'

export function getPlaybook(vertical: string | undefined | null): VerticalPlaybook {
  if (!vertical) return defaultPlaybook
  return REGISTRY.find(p => p.vertical === vertical) ?? defaultPlaybook
}

export function getAllPlaybooks(): VerticalPlaybook[] {
  return REGISTRY
}

export const VERTICAL_LABELS: Record<string, { label: string; emoji: string; color: string }> =
  Object.fromEntries([...REGISTRY, defaultPlaybook].map(p => [p.vertical, { label: p.label, emoji: p.emoji, color: p.color }]))
