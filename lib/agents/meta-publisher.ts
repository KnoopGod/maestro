/**
 * Meta Graph API wrapper (Facebook + Instagram)
 * Handles token exchange, page discovery, and publishing.
 */

const GRAPH_API = 'https://graph.facebook.com/v23.0'

export interface MetaPage {
  id: string
  name: string
  category: string
  accessToken: string
  instagramAccount: {
    id: string
    username: string
    profilePictureUrl?: string
  } | null
  pictureUrl?: string
}

export interface DiscoverResult {
  pages: MetaPage[]
  userName: string
  userId: string
}

// ─── Token exchange ──────────────────────────────────────────────────────────

/**
 * Exchange a short-lived User Access Token for a long-lived one (60 days).
 * Requires META_APP_ID and META_APP_SECRET env vars.
 */
export async function exchangeForLongLivedUserToken(shortToken: string): Promise<string> {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET

  if (!appId || !appSecret) {
    // Without app credentials, return the short token as-is. Posting will still
    // work until it expires (~1h). User should set these env vars for prod.
    return shortToken
  }

  const url = `${GRAPH_API}/oauth/access_token?` + new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortToken,
  })

  const res = await fetch(url)
  const data = await res.json()

  if (!res.ok || !data.access_token) {
    throw new Error(data.error?.message || 'Échec échange token longue durée')
  }

  return data.access_token as string
}

// ─── Discover pages ──────────────────────────────────────────────────────────

/**
 * Given a user access token, discover all Facebook Pages the user manages
 * + their linked Instagram Business accounts.
 */
export async function discoverPages(userToken: string): Promise<DiscoverResult> {
  // 1. Get user info
  const meRes = await fetch(`${GRAPH_API}/me?fields=id,name&access_token=${userToken}`)
  const me = await meRes.json()
  if (!meRes.ok) {
    throw new Error(me.error?.message || 'Token utilisateur invalide')
  }

  // 2. Get all pages the user manages
  const pagesRes = await fetch(
    `${GRAPH_API}/me/accounts?` +
    `fields=id,name,category,access_token,picture.type(large),instagram_business_account{id,username,profile_picture_url}` +
    `&limit=100&access_token=${userToken}`
  )
  const pagesData = await pagesRes.json()

  if (!pagesRes.ok) {
    throw new Error(pagesData.error?.message || 'Impossible de lister les pages')
  }

  const pages: MetaPage[] = (pagesData.data ?? []).map((p: {
    id: string
    name: string
    category: string
    access_token: string
    picture?: { data?: { url?: string } }
    instagram_business_account?: { id: string; username: string; profile_picture_url?: string }
  }) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    accessToken: p.access_token,
    pictureUrl: p.picture?.data?.url,
    instagramAccount: p.instagram_business_account
      ? {
          id: p.instagram_business_account.id,
          username: p.instagram_business_account.username,
          profilePictureUrl: p.instagram_business_account.profile_picture_url,
        }
      : null,
  }))

  return {
    pages,
    userName: me.name,
    userId: me.id,
  }
}

export async function discoverInstagramAccountForPage(
  pageId: string,
  pageToken: string
): Promise<MetaPage['instagramAccount']> {
  const res = await fetch(
    `${GRAPH_API}/${pageId}?` +
      `fields=instagram_business_account{id,username,profile_picture_url}` +
      `&access_token=${encodeURIComponent(pageToken)}`
  )
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error?.message || 'Impossible de vérifier Instagram pour cette page')
  }

  const account = data.instagram_business_account
  if (!account?.id || !account?.username) return null

  return {
    id: account.id,
    username: account.username,
    profilePictureUrl: account.profile_picture_url,
  }
}

// ─── Verify a Page token ─────────────────────────────────────────────────────

export async function verifyPageToken(pageId: string, pageToken: string): Promise<{
  valid: boolean
  pageName?: string
  error?: string
}> {
  try {
    const res = await fetch(`${GRAPH_API}/${pageId}?fields=name&access_token=${pageToken}`)
    const data = await res.json()
    if (!res.ok) return { valid: false, error: data.error?.message }
    return { valid: true, pageName: data.name }
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : 'Erreur inconnue' }
  }
}

// ─── Debug a token (returns permissions, expiry, etc.) ────────────────────────

export interface TokenDebugInfo {
  valid: boolean
  appId?: string
  type?: string
  application?: string
  expiresAt?: number | null
  scopes: string[]
  userId?: string
  pageName?: string
  pageId?: string
  requiredPermissions: string[]
  hasRequiredPermissions: boolean
  missingPermissions: string[]
  error?: string
}

const USER_DISCOVERY_PERMISSIONS = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'instagram_basic',
  'instagram_content_publish',
]

const PAGE_PUBLISHING_PERMISSIONS = [
  'pages_read_engagement',
  'pages_manage_posts',
  'instagram_basic',
  'instagram_content_publish',
]

export async function debugToken(token: string, pageId?: string): Promise<TokenDebugInfo> {
  const requiredPermissions = pageId ? PAGE_PUBLISHING_PERMISSIONS : USER_DISCOVERY_PERMISSIONS

  try {
    const debugAccessToken = getDebugAccessToken(token)
    const res = await fetch(`${GRAPH_API}/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(debugAccessToken)}`)
    const data = await res.json()

    if (!res.ok || !data.data) {
      return {
        valid: false,
        scopes: [],
        requiredPermissions,
        hasRequiredPermissions: false,
        missingPermissions: requiredPermissions,
        error: data.error?.message || 'Token invalide',
      }
    }

    const d = data.data
    const scopes: string[] = d.scopes ?? []
    const missing = requiredPermissions.filter(p => !scopes.includes(p))

    let pageName: string | undefined
    if (pageId) {
      const pageRes = await fetch(`${GRAPH_API}/${pageId}?fields=name&access_token=${encodeURIComponent(token)}`)
      const pageData = await pageRes.json()
      if (pageRes.ok) pageName = pageData.name
    }

    return {
      valid: !!d.is_valid,
      appId: d.app_id,
      type: d.type,
      application: d.application,
      expiresAt: d.expires_at ? d.expires_at * 1000 : null,
      scopes,
      userId: d.user_id,
      pageId,
      pageName,
      requiredPermissions,
      hasRequiredPermissions: missing.length === 0,
      missingPermissions: missing,
    }
  } catch (err) {
    return {
      valid: false,
      scopes: [],
      requiredPermissions,
      hasRequiredPermissions: false,
      missingPermissions: requiredPermissions,
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    }
  }
}

function getDebugAccessToken(fallbackToken: string) {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  return appId && appSecret ? `${appId}|${appSecret}` : fallbackToken
}

// ─── Publish to Facebook Page ────────────────────────────────────────────────

export interface PublishOptions {
  pageId: string
  pageToken: string
  message: string
  imageUrl?: string
  link?: string
}

export async function publishToFacebook(opts: PublishOptions): Promise<{ postId: string; url: string }> {
  const endpoint = opts.imageUrl
    ? `${GRAPH_API}/${opts.pageId}/photos`
    : `${GRAPH_API}/${opts.pageId}/feed`

  const body: Record<string, string> = {
    access_token: opts.pageToken,
    message: opts.message,
  }

  if (opts.imageUrl) body.url = opts.imageUrl
  if (opts.link) body.link = opts.link

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error?.message || 'Échec publication Facebook')
  }

  const postId = data.post_id || data.id
  return {
    postId,
    url: `https://www.facebook.com/${postId}`,
  }
}

// ─── Publish to Instagram ────────────────────────────────────────────────────

export interface InstagramPublishOptions {
  igAccountId: string
  pageToken: string
  imageUrl: string  // must be a public URL
  caption: string
  placement?: 'feed' | 'story'
}

export async function publishToInstagram(opts: InstagramPublishOptions): Promise<{ postId: string }> {
  const placement = opts.placement ?? 'feed'
  const body: Record<string, string> = {
    image_url: opts.imageUrl,
    access_token: opts.pageToken,
  }

  if (placement === 'story') {
    body.media_type = 'STORIES'
  } else {
    body.caption = opts.caption
  }

  // 1. Create media container
  const containerRes = await fetch(
    `${GRAPH_API}/${opts.igAccountId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body),
    }
  )

  const container = await containerRes.json()
  if (!containerRes.ok) {
    throw new Error(container.error?.message || 'Échec création conteneur Instagram')
  }

  const creationId = container.id

  // 2. Publish the container
  const publishRes = await fetch(
    `${GRAPH_API}/${opts.igAccountId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        creation_id: creationId,
        access_token: opts.pageToken,
      }),
    }
  )

  const published = await publishRes.json()
  if (!publishRes.ok) {
    throw new Error(published.error?.message || 'Échec publication Instagram')
  }

  return { postId: published.id }
}
