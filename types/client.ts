export type ClientType = 'restaurant' | 'hotel' | 'bar' | 'bnb' | 'restaurant_hotel'
export type ClientStatus = 'active' | 'paused' | 'archived'
export type SocialPlatform = 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'google_business'
export type ClientVertical = string
export type ConversionChannel =
  | 'phone'
  | 'whatsapp'
  | 'instagram_dm'
  | 'facebook_dm'
  | 'website'
  | 'booking_platform'
  | 'google_maps'
  | 'email'
  | 'walk_in'

export type BusinessObjective =
  | 'fill_slow_days'
  | 'increase_calls'
  | 'increase_bookings'
  | 'sell_offer'
  | 'sell_membership'
  | 'promote_event'
  | 'get_google_reviews'
  | 'increase_dms'
  | 'reduce_platform_dependency'
  | 'improve_google_maps_visibility'
  | 'increase_revenue_period'
  | 'attract_new_customers'

export type BusinessTargetDelay = '30d' | '3m' | '6m'

export interface ClientBusinessProfile {
  vertical: ClientVertical
  mainOffers: string[]
  avgBasketEur: number | null
  peakDays: string[]
  offDays: string[]
  conversionChannels: ConversionChannel[]
  monthlyRevenueEur: number | null
  priorityObjective: BusinessObjective
  targetDelay: BusinessTargetDelay
  constraints: string[]
  localCompetitors: string[]
  seasonality: string | null
}

export interface ClientStrategy {
  objective: string
  contentPillars: string[]
  platforms: ('instagram' | 'facebook' | 'tiktok' | 'linkedin')[]
  frequency: string
  bestTimes: string[]
  avoid: string[]
}

export interface Client {
  id: string
  name: string
  type: ClientType
  city: string | null
  status: ClientStatus
  emoji: string
  color: string
  description: string | null
  clientSummary: string | null
  internalNotes: string | null
  brandVoiceTone: string | null
  brandVoiceKeywords: string | null
  brandVoiceAvoid: string | null
  languages: string[]
  strategy: ClientStrategy
  businessProfile: ClientBusinessProfile | null
  createdAt: number
  updatedAt: number
}

export interface ClientSocialAccount {
  id: string
  clientId: string
  platform: SocialPlatform
  handle: string | null
  accountId: string | null
  accessToken: string | null
  refreshToken: string | null
  connectedAt: number | null
  expiresAt: number | null
  createdAt: number
}

export interface ClientWithStats extends Client {
  postsThisMonth: number
  engagement: number
  agentsCount: number
  connectedPlatforms: number
  lastPostAt: number | null
  daysSincePost: number | null
  nextPillar: string | null
}

// ─── Type config (for UI) ─────────────────────────────────────────────────
export const CLIENT_TYPES: Record<ClientType, { label: string; emoji: string; color: string }> = {
  restaurant:        { label: 'Restaurant',     emoji: '🍴', color: 'from-orange-600 to-red-700' },
  hotel:             { label: 'Hôtel',          emoji: '🏨', color: 'from-blue-600 to-cyan-700' },
  bar:               { label: 'Bar',            emoji: '🍸', color: 'from-purple-600 to-fuchsia-700' },
  bnb:               { label: 'Chambre d\'hôte', emoji: '🏡', color: 'from-emerald-600 to-green-800' },
  restaurant_hotel:  { label: 'Resto + Hôtel',  emoji: '🌲', color: 'from-amber-600 to-orange-700' },
}

export const CLIENT_STATUS: Record<ClientStatus, { label: string; color: string }> = {
  active:   { label: 'Actif',   color: 'bg-emerald-900/40 text-emerald-400 border-emerald-800/40' },
  paused:   { label: 'Pause',   color: 'bg-amber-900/40 text-amber-400 border-amber-800/40' },
  archived: { label: 'Archivé', color: 'bg-gray-900/40 text-gray-400 border-gray-800/40' },
}

export const BUSINESS_OBJECTIVES: Record<BusinessObjective, { label: string; description: string }> = {
  fill_slow_days: {
    label: 'Remplir les jours creux',
    description: 'Créer de la demande sur les créneaux faibles.',
  },
  increase_calls: {
    label: 'Augmenter les appels',
    description: 'Pousser les clients à appeler directement.',
  },
  increase_bookings: {
    label: 'Augmenter les réservations',
    description: 'Générer plus de réservations directes.',
  },
  sell_offer: {
    label: 'Vendre une offre',
    description: 'Mettre en avant une prestation, un menu, un pack ou un service.',
  },
  sell_membership: {
    label: 'Vendre un abonnement',
    description: 'Convertir vers un abonnement, une carte ou une formule récurrente.',
  },
  promote_event: {
    label: 'Promouvoir un événement',
    description: 'Remplir un événement, tournoi, soirée ou opération spéciale.',
  },
  get_google_reviews: {
    label: 'Obtenir plus d’avis Google',
    description: 'Renforcer la preuve sociale et la visibilité locale.',
  },
  increase_dms: {
    label: 'Augmenter les messages',
    description: 'Générer des demandes entrantes Instagram/Facebook/WhatsApp.',
  },
  reduce_platform_dependency: {
    label: 'Réduire la dépendance plateformes',
    description: 'Favoriser les réservations/directes plutôt que les intermédiaires.',
  },
  improve_google_maps_visibility: {
    label: 'Améliorer Google Maps',
    description: 'Travailler la présence locale et les actions Google Business.',
  },
  increase_revenue_period: {
    label: 'Augmenter le CA sur une période',
    description: 'Piloter une progression commerciale mesurable.',
  },
  attract_new_customers: {
    label: 'Attirer de nouveaux clients',
    description: 'Faire découvrir le commerce à une nouvelle audience locale.',
  },
}

export const CONVERSION_CHANNELS: Record<ConversionChannel, { label: string }> = {
  phone: { label: 'Téléphone' },
  whatsapp: { label: 'WhatsApp' },
  instagram_dm: { label: 'DM Instagram' },
  facebook_dm: { label: 'Messenger Facebook' },
  website: { label: 'Site web' },
  booking_platform: { label: 'Plateforme de réservation' },
  google_maps: { label: 'Google Maps' },
  email: { label: 'Email' },
  walk_in: { label: 'Passage en boutique' },
}

export const BUSINESS_TARGET_DELAYS: Record<BusinessTargetDelay, { label: string }> = {
  '30d': { label: '30 jours' },
  '3m': { label: '3 mois' },
  '6m': { label: '6 mois' },
}
