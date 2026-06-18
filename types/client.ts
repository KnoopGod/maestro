export type ClientType = 'restaurant' | 'hotel' | 'bar' | 'bnb' | 'restaurant_hotel'
export type ClientStatus = 'active' | 'paused' | 'archived'
export type SocialPlatform = 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'google_business'

// ─── Business Profile ─────────────────────────────────────────────────────────

export type BusinessObjective =
  | 'fill_slow_days'
  | 'increase_bookings'
  | 'sell_offer'
  | 'sell_membership'
  | 'promote_event'
  | 'get_google_reviews'
  | 'increase_dms'
  | 'increase_calls'
  | 'reduce_platform_dependency'
  | 'attract_new_customers'
  | 'increase_visibility'
  | 'increase_revenue_period'

export type ConversionChannel =
  | 'phone'
  | 'whatsapp'
  | 'instagram_dm'
  | 'facebook_dm'
  | 'website'
  | 'online_booking'
  | 'booking_platform'
  | 'google_maps'
  | 'email'
  | 'walk_in'

export interface ClientBusinessProfile {
  vertical: string                      // ex: 'restaurant', 'coiffeur', 'padel'
  mainOffers: string[]                  // ex: ['Coupe femme 45€', 'Balayage 95€']
  avgBasketEur: number | null           // panier moyen en euros
  peakDays: string[]                    // jours de fort trafic
  offDays: string[]                     // jours creux à remplir
  conversionChannels: ConversionChannel[]
  priorityObjective: BusinessObjective
  targetDelayDays: number               // 30, 90, 180
  constraints: string[]                 // ex: ['seul gérant', 'pas de pub payante']
  localCompetitors: string[]
  seasonality: string | null
}

export const BUSINESS_OBJECTIVE_LABELS: Record<BusinessObjective, { label: string; emoji: string; description: string }> = {
  fill_slow_days:             { label: 'Remplir les jours creux',     emoji: '📅', description: 'Générer du trafic sur les créneaux faibles' },
  increase_bookings:          { label: 'Augmenter les réservations',  emoji: '📞', description: 'Plus de réservations ou RDV directs' },
  sell_offer:                 { label: 'Vendre une offre',            emoji: '🎁', description: 'Promouvoir une offre ou promotion spécifique' },
  sell_membership:            { label: 'Vendre des abonnements',      emoji: '🔄', description: 'Convertir en membres ou abonnés' },
  promote_event:              { label: 'Promouvoir un événement',     emoji: '🎉', description: 'Visibilité et inscriptions pour un événement' },
  get_google_reviews:         { label: 'Obtenir des avis Google',     emoji: '⭐', description: 'Augmenter les avis Google Maps' },
  increase_dms:               { label: 'Augmenter les DMs',           emoji: '💬', description: 'Générer plus de messages directs' },
  increase_calls:             { label: 'Augmenter les appels',        emoji: '📱', description: 'Générer plus d\'appels téléphoniques entrants' },
  reduce_platform_dependency: { label: 'Réduire les plateformes',     emoji: '🔗', description: 'Moins dépendre de Booking, The Fork, Uber Eats…' },
  attract_new_customers:      { label: 'Attirer de nouveaux clients', emoji: '✨', description: 'Toucher une audience qui ne vous connaît pas encore' },
  increase_visibility:        { label: 'Augmenter la visibilité',     emoji: '👁️', description: 'Plus de reach et de notoriété locale' },
  increase_revenue_period:    { label: 'Booster le CA sur une période', emoji: '📈', description: 'Maximiser les revenus sur une période ciblée' },
}

export const CONVERSION_CHANNEL_LABELS: Record<ConversionChannel, string> = {
  phone:            'Téléphone',
  whatsapp:         'WhatsApp',
  instagram_dm:     'Instagram DM',
  facebook_dm:      'Facebook DM',
  website:          'Site web',
  online_booking:   'Réservation en ligne',
  booking_platform: 'Plateforme (Booking, The Fork…)',
  google_maps:      'Google Maps',
  email:            'Email',
  walk_in:          'Passage en boutique',
}

// ─── Strategy ─────────────────────────────────────────────────────────────────

export interface ClientStrategy {
  objective: string
  contentPillars: string[]
  platforms: ('instagram' | 'facebook' | 'tiktok' | 'linkedin')[]
  frequency: string
  bestTimes: string[]
  avoid: string[]
}

// ─── Client ───────────────────────────────────────────────────────────────────

export interface Client {
  id: string
  name: string
  type: ClientType
  city: string | null
  status: ClientStatus
  emoji: string
  color: string
  description: string | null
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

// ─── Type config (for UI) ─────────────────────────────────────────────────────
export const CLIENT_TYPES: Record<ClientType, { label: string; emoji: string; color: string }> = {
  restaurant:        { label: 'Restaurant',      emoji: '🍴', color: 'from-orange-600 to-red-700' },
  hotel:             { label: 'Hôtel',           emoji: '🏨', color: 'from-blue-600 to-cyan-700' },
  bar:               { label: 'Bar',             emoji: '🍸', color: 'from-purple-600 to-fuchsia-700' },
  bnb:               { label: 'Chambre d\'hôte', emoji: '🏡', color: 'from-emerald-600 to-green-800' },
  restaurant_hotel:  { label: 'Resto + Hôtel',   emoji: '🌲', color: 'from-amber-600 to-orange-700' },
}

export const CLIENT_STATUS: Record<ClientStatus, { label: string; color: string }> = {
  active:   { label: 'Actif',   color: 'bg-emerald-900/40 text-emerald-400 border-emerald-800/40' },
  paused:   { label: 'Pause',   color: 'bg-amber-900/40 text-amber-400 border-amber-800/40' },
  archived: { label: 'Archivé', color: 'bg-gray-900/40 text-gray-400 border-gray-800/40' },
}


