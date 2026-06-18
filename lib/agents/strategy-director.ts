import type { ClientStrategy, ClientType, ClientBusinessProfile } from '@/types/client'

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

interface StrategyDefaults {
  contentPillars: string[]
  frequency: string
  bestTimes: string[]
  avoid: string[]
}

// Legacy HORECA defaults — used when no playbook matches
const defaultsByType: Record<ClientType, StrategyDefaults> = {
  restaurant: {
    contentPillars: ['Plat signature sensoriel', 'Coulisses et geste artisanal', 'Avis client', 'Saisonnalité', 'Origine produit', 'Équipe', 'Événement'],
    frequency: '4 posts/semaine',
    bestTimes: ['11:00', '17:30', '18:00'],
    avoid: ['ton luxe froid', 'visuels stock photo', '#food #yummy'],
  },
  bar: {
    contentPillars: ['Cocktail signature', 'Behind the bar', 'Happy hour', 'Soirée thématique', 'Nouveau cocktail', 'Ambiance soir'],
    frequency: '5 posts/semaine',
    bestTimes: ['16:00', '17:30', '20:00'],
    avoid: ['ton institutionnel', 'visuels trop sages', 'photos sous-exposées'],
  },
  hotel: {
    contentPillars: ['Chambre lifestyle avec ambiance', 'Vue et environnement', 'Expériences locales', 'Petit-déjeuner', 'Témoignage client', 'Offre directe'],
    frequency: '4 posts/semaine',
    bestTimes: ['08:30', '12:00', '18:00'],
    avoid: ['chambres vides sans mise en scène', 'vocabulaire hôtel de chaîne', 'photos impersonnelles'],
  },
  bnb: {
    contentPillars: ['Cadre naturel', 'Petit-déjeuner fait maison', 'Activités locales', 'Chambre mise en scène', 'Témoignage chaleureux', 'Hôte et histoire'],
    frequency: '3 posts/semaine',
    bestTimes: ['08:00', '12:30', '18:30'],
    avoid: ['commencer par le prix', 'ton commercial froid', 'oublier l\'histoire de l\'hôte'],
  },
  restaurant_hotel: {
    contentPillars: ['Plat signature', 'Chambre lifestyle', 'Expérience globale', 'Coulisses', 'Petit-déjeuner', 'Avis client', 'Événement'],
    frequency: '4 posts/semaine',
    bestTimes: ['11:00', '18:00', '19:15'],
    avoid: ['ton luxe froid', 'chambres vides', 'visuels stock photo'],
  },
}

export function createClientStrategy(input: StrategyInput): ClientStrategy {
  // If a businessProfile with vertical exists, try to use playbook defaults
  const vertical = input.businessProfile?.vertical
  let pillars: string[]
  let frequency: string
  let bestTimes: string[]
  let avoid: string[]

  if (vertical) {
    // Dynamic playbook lookup — lazy to avoid circular deps at module load
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getPlaybook } = require('@/lib/playbooks') as { getPlaybook: (v: string) => { contentPillars: string[]; bestPostingTimes: string[]; commonMistakes: string[] } }
      const playbook = getPlaybook(vertical)
      pillars = playbook.contentPillars
      frequency = '4 posts/semaine'
      bestTimes = playbook.bestPostingTimes
      avoid = [...sharedAvoid, ...playbook.commonMistakes.slice(0, 3)]
    } catch {
      const defaults = defaultsByType[input.type] ?? defaultsByType.restaurant
      pillars = defaults.contentPillars
      frequency = defaults.frequency
      bestTimes = defaults.bestTimes
      avoid = [...sharedAvoid, ...defaults.avoid]
    }
  } else {
    const defaults = defaultsByType[input.type] ?? defaultsByType.restaurant
    pillars = defaults.contentPillars
    frequency = defaults.frequency
    bestTimes = defaults.bestTimes
    avoid = [...sharedAvoid, ...defaults.avoid]
  }

  const context = [
    input.positioning.trim() ? `Positionnement : ${input.positioning.trim()}.` : '',
    input.offerFocus.trim() ? `Offre prioritaire : ${input.offerFocus.trim()}.` : '',
    input.tone.trim() ? `Ton à privilégier : ${input.tone.trim()}.` : '',
    input.businessProfile?.priorityObjective ? `Objectif prioritaire : ${input.businessProfile.priorityObjective}.` : '',
  ].filter(Boolean)

  const objective = [
    `Développer la notoriété locale de ${input.name}${input.city.trim() ? ` à ${input.city.trim()}` : ''} et transformer l'intérêt social en résultats business mesurables.`,
    ...context,
  ].join(' ')

  return {
    objective,
    contentPillars: pillars,
    platforms: ['instagram', 'facebook'],
    frequency,
    bestTimes,
    avoid,
  }
}
