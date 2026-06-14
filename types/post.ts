export type PostStatus = 'draft' | 'ready' | 'scheduled' | 'published' | 'failed'

export interface PortalFeedback {
  action: 'approved' | 'changes_requested'
  comment: string
  reviewedAt: number
}
export type PostPlatform = 'instagram' | 'facebook' | 'tiktok' | 'linkedin'
export type PostContentType = 'photo' | 'reel' | 'story'

export interface Post {
  id: string
  clientId: string
  status: PostStatus
  platforms: PostPlatform[]
  contentType: PostContentType
  brief: string
  pillar: string | null
  reasoning: string | null
  caption: string
  hashtags: string[]
  hook: string | null
  cta: string | null
  ctaType: string | null
  ctaUrl: string | null
  imageAssetId: string | null
  imageUrl: string | null
  imagePrompt: string | null
  impactScore: number
  impactAnalysis: string | null
  metaPostIds: Record<string, string>
  metaInsights: PostInsights[]
  supervisorReview: SupervisorReview | null
  portalFeedback: PortalFeedback | null
  scheduledAt: number | null
  publishedAt: number | null
  error: string | null
  cost: number
  tokensUsed: number
  createdAt: number
  updatedAt: number
}

export interface PostInsights {
  platform: 'facebook' | 'instagram'
  likes: number
  comments: number
  shares: number
  reach: number
  impressions: number
  saves?: number
  fetchedAt: number
}

export interface SupervisorReview {
  verdict: 'ready' | 'revise' | 'blocked'
  score: number
  summary: string
  risks: string[]
  improvements: string[]
  nextAction: string
}
