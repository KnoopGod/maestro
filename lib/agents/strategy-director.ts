import type { ClientStrategy, ClientType } from '@/types/client'

const sharedAvoid = ['contenu générique', 'promesses exagérées', 'ton robotique']

const restaurantPillars = ['Plat signature', 'Menu du jour', 'Coulisses', 'Avis client', 'Réservation week-end']
const hotelPillars = ['Chambres', 'Expérience locale', 'Petit-déjeuner', 'Saisonnalité', 'Avis client']

interface StrategyInput {
  type: ClientType
  name: string
  city: string
  positioning: string
  tone: string
  offerFocus: string
}

interface StrategyDefaults {
  contentPillars: string[]
  frequency: string
  bestTimes: string[]
  avoid: string[]
}

const defaultsByType: Record<ClientType, StrategyDefaults> = {
  restaurant: {
    contentPillars: restaurantPillars,
    frequency: '4 posts/semaine',
    bestTimes: ['11:30', '18:30', '19:15'],
    avoid: ['ton luxe froid', 'visuels stock photo'],
  },
  bar: {
    contentPillars: ['Cocktail signature', 'Ambiance soirée', 'Happy hour', 'Événement', 'Clientèle locale'],
    frequency: '5 posts/semaine',
    bestTimes: ['17:30', '20:00', '21:30'],
    avoid: ['ton institutionnel', 'visuels trop sages'],
  },
  hotel: {
    contentPillars: hotelPillars,
    frequency: '4 posts/semaine',
    bestTimes: ['08:30', '12:15', '18:00'],
    avoid: ['vocabulaire hôtel de chaîne', 'photos impersonnelles'],
  },
  bnb: {
    contentPillars: hotelPillars,
    frequency: '3 posts/semaine',
    bestTimes: ['08:30', '12:15', '18:00'],
    avoid: ['vocabulaire hôtel de chaîne', 'photos impersonnelles'],
  },
  restaurant_hotel: {
    contentPillars: [...new Set([...restaurantPillars, ...hotelPillars])],
    frequency: '4 posts/semaine',
    bestTimes: ['11:30', '18:30', '19:15'],
    avoid: ['ton luxe froid', 'visuels stock photo', 'vocabulaire hôtel de chaîne', 'photos impersonnelles'],
  },
}

export function createClientStrategy(input: StrategyInput): ClientStrategy {
  const defaults = defaultsByType[input.type]
  const context = [
    input.positioning.trim() ? `Positionnement : ${input.positioning.trim()}.` : '',
    input.offerFocus.trim() ? `Offre prioritaire : ${input.offerFocus.trim()}.` : '',
    input.tone.trim() ? `Ton à privilégier : ${input.tone.trim()}.` : '',
  ].filter(Boolean)

  return {
    objective: [
      `Développer la notoriété locale de ${input.name}${input.city.trim() ? ` à ${input.city.trim()}` : ''} et transformer l'intérêt social en réservations qualifiées.`,
      ...context,
    ].join(' '),
    contentPillars: defaults.contentPillars,
    platforms: ['instagram', 'facebook'],
    frequency: defaults.frequency,
    bestTimes: defaults.bestTimes,
    avoid: [...sharedAvoid, ...defaults.avoid],
  }
}
