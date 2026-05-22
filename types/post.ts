export type PostStatus = 'draft' | 'published' | 'failed'
export type PostPlatform = 'instagram' | 'facebook' | 'tiktok' | 'linkedin'
export type PostContentType = 'photo' | 'reel' | 'story'

export interface Post {
  id: string
  clientId: string
  status: PostStatus
  platforms: PostPlatform[]
  contentType: PostContentType
  brief: string
  reasoning: string | null
  caption: string
  hashtags: string[]
  hook: string | null
  cta: string | null
  imageAssetId: string | null
  imageUrl: string | null
  imagePrompt: string | null
  impactScore: number
  impactAnalysis: string | null
  metaPostIds: Record<string, string>
  publishedAt: number | null
  error: string | null
  cost: number
  tokensUsed: number
  createdAt: number
  updatedAt: number
}
