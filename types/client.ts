export type ClientType = 'restaurant' | 'hotel' | 'bar' | 'bnb' | 'restaurant_hotel'
export type ClientStatus = 'active' | 'paused' | 'archived'
export type SocialPlatform = 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'google_business'

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
  brandVoiceTone: string | null
  brandVoiceKeywords: string | null
  brandVoiceAvoid: string | null
  languages: string[]
  strategy: ClientStrategy
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
