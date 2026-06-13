import type { Post } from '@/types/post'
import type { BriefFields, GenerationResult, Platform } from './types'

export function createLoadedPostResult(post: Post): GenerationResult {
  return {
    post,
    reasoning: post.reasoning ?? 'Draft existant chargé depuis la file de validation.',
    captions: post.platforms
      .filter((platform): platform is Platform => ['instagram', 'facebook', 'tiktok', 'linkedin'].includes(platform))
      .map(platform => ({
        platform,
        caption: post.caption,
        hashtags: post.hashtags,
        hook: post.hook ?? '',
        cta: post.cta ?? '',
        characterCount: post.caption.length,
      })),
    cost: post.cost,
    tokensUsed: post.tokensUsed,
    model: 'draft-existant',
    review: post.supervisorReview ?? undefined,
  }
}

export function createInitialBriefFields(initialBrief?: string, initialPillar?: string): BriefFields {
  return {
    subject: initialBrief || (initialPillar ? `Créer un post autour du pilier : ${initialPillar}` : ''),
    objective: '',
    tone: '',
    includes: '',
  }
}

export function composeStructuredBrief(fields: BriefFields): string {
  return [
    fields.subject.trim() ? `Sujet : ${fields.subject.trim()}` : '',
    fields.objective.trim() ? `Objectif : ${fields.objective.trim()}` : '',
    fields.tone.trim() ? `Ton : ${fields.tone.trim()}` : '',
    fields.includes.trim() ? `À inclure : ${fields.includes.trim()}` : '',
  ].filter(Boolean).join('\n')
}

export function formatHostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
