/**
 * Publish pipeline — shared between /api/studio/publish-post and the cron job.
 *
 * Responsibilities:
 *   1. Run the Supervisor quality gate (blocks on 'blocked' verdict).
 *   2. Resolve the image URL to a publicly fetchable URL for Meta.
 *   3. Call publishToFacebook / publishToInstagram per platform.
 *   4. Persist status transitions and the supervisor review.
 *
 * Returns the updated Post + any non-fatal warnings + the review used.
 */
import type { Client } from '@/types/client'
import type { Post, SupervisorReview } from '@/types/post'
import { getClient } from '@/lib/db/queries/clients'
import { getSocialAccount } from '@/lib/db/queries/social-accounts'
import { markPostFailed, markPostPublished, setSupervisorReview } from '@/lib/db/queries/posts'
import { publishToFacebook, publishToInstagram } from '@/lib/agents/meta-publisher'
import { supervisePost } from '@/lib/agents/supervisor'

export interface PublishOutcome {
  post: Post
  review: SupervisorReview
  warnings: string[]
  published: Record<string, string>
}

export interface PublishOptions {
  forceTextOnly?: boolean
  /** Skip Claude supervisor (cron typically re-uses the cached review). */
  skipSupervisor?: boolean
}

export class PublishBlockedError extends Error {
  review: SupervisorReview
  constructor(review: SupervisorReview) {
    super(`Bloqué par le supervisor : ${review.summary}`)
    this.review = review
    this.name = 'PublishBlockedError'
  }
}

export async function publishPost(
  post: Post,
  options: PublishOptions = {}
): Promise<PublishOutcome> {
  const client = await getClient(post.clientId)
  if (!client) throw new Error('Client introuvable')

  // ─── Supervisor quality gate ────────────────────────────────────────────
  const review = await resolveSupervisorReview(client, post, options.skipSupervisor)

  if (review.verdict === 'blocked') {
    await markPostFailed(post.id, `Supervisor blocked: ${review.summary}`)
    throw new PublishBlockedError(review)
  }

  // Persist the latest review on the post.
  const postWithReview = await setSupervisorReview(post.id, review)

  // ─── Resolve public image URL ───────────────────────────────────────────
  const publicImageUrl = options.forceTextOnly ? null : toPublicUrl(postWithReview.imageUrl)
  const message = buildMessage(postWithReview.caption, postWithReview.hashtags)
  const published: Record<string, string> = {}
  const warnings: string[] = []

  if (review.verdict === 'revise') {
    warnings.push(review.summary)
  }

  // ─── Facebook (text-only allowed) ───────────────────────────────────────
  if (postWithReview.platforms.includes('facebook')) {
    const fb = await getSocialAccount(postWithReview.clientId, 'facebook')
    if (!fb?.accountId || !fb.accessToken) {
      throw new Error('Facebook non connecté pour ce client — va sur /clients/[id]/connections')
    }
    try {
      const result = await publishToFacebook({
        pageId: fb.accountId,
        pageToken: fb.accessToken,
        message,
        imageUrl: publicImageUrl ?? undefined,
      })
      published.facebook = result.postId

      if (!publicImageUrl && postWithReview.imageUrl) {
        warnings.push(
          "Facebook posté SANS image (l'image est sur localhost, Meta ne peut pas la fetcher). Configure CODEXRS_PUBLIC_URL pour publier les visuels."
        )
      }
    } catch (err) {
      throw decorateMetaError(err, 'Facebook')
    }
  }

  // ─── Instagram (requires public image) ──────────────────────────────────
  if (postWithReview.platforms.includes('instagram')) {
    const ig = await getSocialAccount(postWithReview.clientId, 'instagram')
    if (!ig?.accountId || !ig.accessToken) {
      throw new Error('Instagram non connecté pour ce client')
    }
    if (postWithReview.contentType === 'reel') {
      throw new Error(
        'Instagram Reel non publié : le Publisher actuel accepte les publications et stories image. ' +
        'Pour publier un Reel, il faut d’abord associer une vraie vidéo publique au post.'
      )
    }

    if (!publicImageUrl) {
      warnings.push(
        "Instagram non publié : l'API Instagram exige une image publiquement accessible. Configure CODEXRS_PUBLIC_URL ou déploie l'app."
      )
    } else {
      try {
        const result = await publishToInstagram({
          igAccountId: ig.accountId,
          pageToken: ig.accessToken,
          imageUrl: publicImageUrl,
          caption: message,
          placement: postWithReview.contentType === 'story' ? 'story' : 'feed',
        })
        published.instagram = result.postId
        if (postWithReview.contentType === 'story') {
          warnings.push("Instagram publié en Story : le texte du post reste dans CODEXRS, mais Instagram n'affiche pas la caption sur une Story image.")
        }
      } catch (err) {
        throw decorateMetaError(err, 'Instagram')
      }
    }
  }

  if (Object.keys(published).length === 0) {
    throw new Error(
      warnings.length > 0 ? warnings.join(' ') : 'Aucune plateforme publiable dans ce post'
    )
  }

  const updated = await markPostPublished(postWithReview.id, published)

  return { post: updated, review, warnings, published }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function resolveSupervisorReview(
  client: Client,
  post: Post,
  skip = false
): Promise<SupervisorReview> {
  if (skip && post.supervisorReview) return post.supervisorReview
  const result = await supervisePost({ client, post })
  return result.review
}

export function buildMessage(caption: string, hashtags: string[]) {
  const tags = hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')
  return tags ? `${caption}\n\n${tags}` : caption
}

export function toPublicUrl(imageUrl: string | null) {
  if (!imageUrl) return null
  if (/^https?:\/\//.test(imageUrl)) return imageUrl

  const base = process.env.CODEXRS_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL
  if (!base) return null
  if (/localhost|127\.0\.0\.1/.test(base)) return null
  return `${base.replace(/\/$/, '')}${imageUrl}`
}

/** Wrap Meta errors with actionable hints based on the error code. */
export function decorateMetaError(err: unknown, platform: string): Error {
  const msg = err instanceof Error ? err.message : String(err)

  if (/#200/.test(msg) || /pages_manage_posts/.test(msg)) {
    return new Error(
      `[${platform}] Erreur permissions Meta (#200). ` +
      `Vérifie : (1) ton token a bien pages_manage_posts + pages_read_engagement, ` +
      `(2) tu es ADMIN de la page (pas éditeur), ` +
      `(3) si app en dev, la page doit être liée au même Business Manager. ` +
      `Détails : ${msg}`
    )
  }
  if (/#190/.test(msg) || /token.*invalid|expired/i.test(msg)) {
    return new Error(
      `[${platform}] Token Meta expiré ou invalide. ` +
      `Régénère un User Access Token et reconnecte le client. ` +
      `Détails : ${msg}`
    )
  }
  if (/#100/.test(msg) || /Invalid parameter/.test(msg)) {
    return new Error(
      `[${platform}] Paramètre invalide (souvent : URL image inaccessible depuis Meta). ` +
      `Vérifie que CODEXRS_PUBLIC_URL pointe vers une URL publique. ` +
      `Détails : ${msg}`
    )
  }
  return new Error(`[${platform}] ${msg}`)
}
