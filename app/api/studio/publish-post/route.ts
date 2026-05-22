import { NextRequest, NextResponse } from 'next/server'
import { getPost, markPostFailed, markPostPublished } from '@/lib/db/queries/posts'
import { getSocialAccount } from '@/lib/db/queries/social-accounts'
import { publishToFacebook, publishToInstagram } from '@/lib/agents/meta-publisher'

export async function POST(req: NextRequest) {
  let postId: string | null = null
  try {
    const body = await req.json()
    postId = body.postId
    const forceTextOnly: boolean = !!body.forceTextOnly

    if (!postId) {
      return NextResponse.json({ error: 'postId requis' }, { status: 400 })
    }

    const post = await getPost(postId)
    if (!post) {
      return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
    }

    const publicImageUrl = forceTextOnly ? null : toPublicUrl(post.imageUrl)
    const message = buildMessage(post.caption, post.hashtags)
    const published: Record<string, string> = {}
    const warnings: string[] = []

    // ─── Facebook (allows text-only) ─────────────────────────────
    if (post.platforms.includes('facebook')) {
      const fb = await getSocialAccount(post.clientId, 'facebook')
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

        if (!publicImageUrl && post.imageUrl) {
          warnings.push(
            "Facebook posté SANS image (l'image est sur localhost, Meta ne peut pas la fetcher). Configure MAESTRO_PUBLIC_URL pour publier les visuels."
          )
        }
      } catch (err) {
        throw decorateMetaError(err, 'Facebook')
      }
    }

    // ─── Instagram (REQUIRES public image) ───────────────────────
    if (post.platforms.includes('instagram')) {
      const ig = await getSocialAccount(post.clientId, 'instagram')
      if (!ig?.accountId || !ig.accessToken) {
        throw new Error('Instagram non connecté pour ce client')
      }

      if (!publicImageUrl) {
        warnings.push(
          "Instagram non publié : l'API Instagram exige une image publiquement accessible. Configure MAESTRO_PUBLIC_URL ou déploie l'app."
        )
      } else {
        try {
          const result = await publishToInstagram({
            igAccountId: ig.accountId,
            pageToken: ig.accessToken,
            imageUrl: publicImageUrl,
            caption: message,
          })
          published.instagram = result.postId
        } catch (err) {
          throw decorateMetaError(err, 'Instagram')
        }
      }
    }

    if (Object.keys(published).length === 0) {
      throw new Error(
        warnings.length > 0
          ? warnings.join(' ')
          : 'Aucune plateforme publiable dans ce post'
      )
    }

    const updated = await markPostPublished(post.id, published)

    return NextResponse.json({
      post: updated,
      warnings: warnings.length > 0 ? warnings : undefined,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur publication'
    if (postId) await markPostFailed(postId, message).catch(() => undefined)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function buildMessage(caption: string, hashtags: string[]) {
  const tags = hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')
  return tags ? `${caption}\n\n${tags}` : caption
}

function toPublicUrl(imageUrl: string | null) {
  if (!imageUrl) return null
  if (/^https?:\/\//.test(imageUrl)) return imageUrl

  const base = process.env.MAESTRO_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL
  if (!base) return null
  // Reject if base is localhost — Meta can't fetch from there
  if (/localhost|127\.0\.0\.1/.test(base)) return null
  return `${base.replace(/\/$/, '')}${imageUrl}`
}

/**
 * Wrap Meta errors with actionable hints based on the error code.
 */
function decorateMetaError(err: unknown, platform: string): Error {
  const msg = err instanceof Error ? err.message : String(err)

  // Meta error #200 — permissions / admin
  if (/#200/.test(msg) || /pages_manage_posts/.test(msg)) {
    return new Error(
      `[${platform}] Erreur permissions Meta (#200). ` +
      `Vérifie : (1) ton token a bien pages_manage_posts + pages_read_engagement, ` +
      `(2) tu es ADMIN de la page (pas éditeur), ` +
      `(3) si app en dev, la page doit être liée au même Business Manager. ` +
      `Détails : ${msg}`
    )
  }

  // Meta error #190 — invalid/expired token
  if (/#190/.test(msg) || /token.*invalid|expired/i.test(msg)) {
    return new Error(
      `[${platform}] Token Meta expiré ou invalide. ` +
      `Régénère un User Access Token et reconnecte le client. ` +
      `Détails : ${msg}`
    )
  }

  // Meta error #100 — invalid parameter (often bad image URL)
  if (/#100/.test(msg) || /Invalid parameter/.test(msg)) {
    return new Error(
      `[${platform}] Paramètre invalide (souvent : URL image inaccessible depuis Meta). ` +
      `Vérifie que MAESTRO_PUBLIC_URL pointe vers une URL publique. ` +
      `Détails : ${msg}`
    )
  }

  return new Error(`[${platform}] ${msg}`)
}
