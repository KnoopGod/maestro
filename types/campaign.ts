import type { BusinessObjective } from './client'

export type CampaignChannel = 'meta_ads' | 'google_ads'
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed'

/** Une variante d'annonce Meta prête à copier dans Ads Manager. */
export interface MetaAdCreative {
  /** L'angle marketing de cette variante (ex: "preuve sociale"). */
  angle: string
  /** Texte principal, ~300 caractères max, accroche incluse. */
  primaryText: string
  /** Titre, 40 caractères max. */
  headline: string
  /** Description, 30 caractères max. */
  description: string
  /** CTA recommandé (ex: "Demander un devis"). */
  cta: string
  /** Brief du visuel — réutilisable dans le Studio. */
  visualBrief: string
}

/** Pack Responsive Search Ad prêt à copier dans Google Ads. */
export interface GoogleAdCreative {
  /** 10-15 titres, 30 caractères max chacun (limite RSA stricte). */
  headlines: string[]
  /** 4 descriptions, 90 caractères max chacune. */
  descriptions: string[]
  /** 15-25 mots-clés en intention commerciale. */
  keywords: string[]
  negativeKeywords: string[]
}

export interface MediaPlan {
  /** Ciblage recommandé, en langage clair. */
  audience: string
  /** Répartition budget recommandée (ex: "70% prospection / 30% retargeting"). */
  budgetSplit: string
  duration: string
  /** Où envoyer le clic et quoi vérifier sur la page d'arrivée. */
  landingAdvice: string
  metaCreatives?: MetaAdCreative[]
  googleCreative?: GoogleAdCreative
  kpisToWatch: string[]
}

/** Résultats saisis manuellement depuis Ads Manager / Google Ads (Phase 1). */
export interface CampaignResults {
  spendEur: number | null
  impressions: number | null
  clicks: number | null
  /** Conversions déclarées : devis, réservations, appels. */
  leads: number | null
  /** CA attribué, déclaré par le client. */
  revenueEur: number | null
  notes: string | null
  updatedAt: number
}

export interface Campaign {
  id: string
  clientId: string
  name: string
  channel: CampaignChannel
  objective: BusinessObjective
  budgetEur: number
  startAt: number | null
  endAt: number | null
  status: CampaignStatus
  /** Brief saisi par l'agence à la création. */
  brief: string
  /** Plan média généré par l'agent media-planner. */
  mediaPlan: MediaPlan | null
  results: CampaignResults | null
  /** Coût IA de génération (donnée interne agence — ne jamais montrer au client). */
  cost: number
  createdAt: number
  updatedAt: number
}

// ─── Config UI ────────────────────────────────────────────────────────────────

export const CAMPAIGN_CHANNELS: Record<CampaignChannel, { label: string; emoji: string; color: string }> = {
  meta_ads:   { label: 'Meta Ads',   emoji: '📘', color: 'bg-blue-950/40 text-blue-300 border-blue-700/40' },
  google_ads: { label: 'Google Ads', emoji: '🔍', color: 'bg-amber-950/40 text-amber-300 border-amber-700/40' },
}

export const CAMPAIGN_STATUS: Record<CampaignStatus, { label: string; color: string }> = {
  draft:     { label: 'Brouillon', color: 'bg-gray-800 text-gray-400 border-gray-700' },
  active:    { label: 'Active',    color: 'bg-emerald-950/40 text-emerald-300 border-emerald-700/40' },
  paused:    { label: 'En pause',  color: 'bg-amber-950/40 text-amber-300 border-amber-700/40' },
  completed: { label: 'Terminée',  color: 'bg-indigo-950/40 text-indigo-300 border-indigo-700/40' },
}

// ─── Limites de caractères des régies ─────────────────────────────────────────

export const META_LIMITS = { headline: 40, description: 30, primaryText: 300 } as const
export const GOOGLE_LIMITS = { headline: 30, description: 90 } as const
