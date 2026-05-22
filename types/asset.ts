export type AssetType = 'image' | 'video' | 'logo' | 'document' | 'brand_guide'
export type AssetCategory =
  | 'interior'
  | 'exterior'
  | 'food'
  | 'drink'
  | 'ambiance'
  | 'team'
  | 'event'
  | 'detail'
  | 'menu'
  | 'guideline'
  | 'inspiration'
  | 'other'

export interface ClientAsset {
  id: string
  clientId: string
  type: AssetType
  category: AssetCategory | null
  filename: string
  originalName: string
  url: string
  thumbnailUrl: string | null
  mimeType: string
  sizeBytes: number
  width: number | null
  height: number | null
  durationSeconds: number | null
  aiDescription: string | null
  aiTags: string[]
  dominantColors: string[]
  mood: string | null
  extractedText: string | null
  analyzedAt: number | null
  starred: boolean
  usedCount: number
  createdAt: number
}

export interface VisualIdentity {
  clientId: string
  palette: string[]
  lightingStyle: string | null
  overallMood: string | null
  compositionPref: string | null
  styleKeywords: string[]
  avoidKeywords: string[]
  stylePrompt: string | null
  visualSummary: string | null
  analyzedAt: number | null
  assetsCount: number
}

export const ASSET_TYPES: Record<AssetType, { label: string; emoji: string; accept: string }> = {
  image:       { label: 'Image',          emoji: '🖼️',  accept: 'image/jpeg,image/png,image/webp,image/gif' },
  video:       { label: 'Vidéo',          emoji: '🎬', accept: 'video/mp4,video/webm,video/quicktime' },
  logo:        { label: 'Logo',           emoji: '🎨', accept: 'image/png,image/svg+xml,image/jpeg' },
  document:    { label: 'Document',       emoji: '📄', accept: 'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown' },
  brand_guide: { label: 'Guide de marque', emoji: '📚', accept: 'application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown' },
}

export const ASSET_CATEGORIES: Record<AssetCategory, { label: string; emoji: string }> = {
  interior:    { label: 'Intérieur',    emoji: '🏠' },
  exterior:    { label: 'Extérieur',    emoji: '🏛️' },
  food:        { label: 'Plats',        emoji: '🍽️' },
  drink:       { label: 'Boissons',     emoji: '🍸' },
  ambiance:    { label: 'Ambiance',     emoji: '✨' },
  team:        { label: 'Équipe',       emoji: '👥' },
  event:       { label: 'Événement',    emoji: '🎉' },
  detail:      { label: 'Détail',       emoji: '🔍' },
  menu:        { label: 'Menu',         emoji: '📋' },
  guideline:   { label: 'Charte DA',    emoji: '🎨' },
  inspiration: { label: 'Inspiration',  emoji: '💡' },
  other:       { label: 'Autre',        emoji: '📁' },
}

export function detectAssetType(mimeType: string): AssetType {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  return 'document'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
