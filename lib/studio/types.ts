import type { Post, SupervisorReview } from '@/types/post'
import type { AccountDirective } from '@/lib/agents/account-director'

export type Platform = 'instagram' | 'facebook' | 'tiktok' | 'linkedin'
export type ContentType = 'photo' | 'reel' | 'story'

export interface GeneratedCaption {
  platform: Platform
  caption: string
  hashtags: string[]
  hook: string
  cta: string
  characterCount: number
}

export interface GenerationResult {
  post: Post
  reasoning: string
  captions: GeneratedCaption[]
  cost: number
  tokensUsed: number
  model: string
  review?: SupervisorReview
  directive?: AccountDirective
  imageError?: string
}

export interface BriefFields {
  subject: string
  objective: string
  tone: string
  includes: string
}

export const PLATFORM_INFO: Record<Platform, { label: string; emoji: string; color: string }> = {
  instagram: { label: 'Instagram', emoji: '📷', color: 'bg-pink-600/20 border-pink-600/40 text-pink-300' },
  facebook:  { label: 'Facebook',  emoji: '👍', color: 'bg-blue-600/20 border-blue-600/40 text-blue-300' },
  tiktok:    { label: 'TikTok',    emoji: '🎵', color: 'bg-purple-600/20 border-purple-600/40 text-purple-300' },
  linkedin:  { label: 'LinkedIn',  emoji: '💼', color: 'bg-sky-600/20 border-sky-600/40 text-sky-300' },
}

export const CONTENT_TYPE_INFO: Record<ContentType, { label: string; title: string; note: string }> = {
  photo: {
    label: '📸 Publication',
    title: 'Publier dans le feed Instagram et/ou Facebook avec image + caption',
    note: 'Format standard : feed Instagram + post Facebook.',
  },
  story: {
    label: '📖 Story',
    title: 'Publier en Story Instagram avec une image publique',
    note: 'Sur Instagram, la Story publie le visuel. La caption reste dans CODEXRS pour validation.',
  },
  reel: {
    label: '🎬 Reel',
    title: 'Préparer un Reel vidéo. La publication automatique nécessite une vidéo publique liée au post.',
    note: "Publie un Reel Instagram à partir d'une vidéo publique sélectionnée dans la Library.",
  },
}
