export interface LinkedInPublishInput {
  organizationId: string
  accessToken: string
  caption: string
  hashtags: string[]
  imageUrl?: string
}

export interface LinkedInPublishResult {
  postId: string
}

export async function publishToLinkedIn(input: LinkedInPublishInput): Promise<LinkedInPublishResult> {
  const text = buildText(input.caption, input.hashtags)

  let assetUrn: string | undefined

  if (input.imageUrl) {
    assetUrn = await uploadImage(input.imageUrl, input.organizationId, input.accessToken)
  }

  const body = buildUgcPost(text, input.organizationId, assetUrn)

  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    if (res.status === 401) throw new Error(`[LinkedIn] Token expiré ou invalide (401). Régénère le token depuis LinkedIn Developer Portal. ${detail}`)
    if (res.status === 422) throw new Error(`[LinkedIn] Contenu refusé par LinkedIn (422). ${detail}`)
    throw new Error(`[LinkedIn] Erreur publication (${res.status}). ${detail}`)
  }

  const json = await res.json() as { id: string }
  return { postId: json.id }
}

function buildText(caption: string, hashtags: string[]): string {
  const tags = hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')
  return tags ? `${caption}\n\n${tags}` : caption
}

async function uploadImage(
  imageUrl: string,
  organizationId: string,
  accessToken: string
): Promise<string> {
  // Step 1: register upload
  const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      registerUploadRequest: {
        owner: `urn:li:organization:${organizationId}`,
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        serviceRelationships: [
          { identifier: 'urn:li:userGeneratedContent', relationshipType: 'OWNER' },
        ],
      },
    }),
  })

  if (!registerRes.ok) {
    const detail = await registerRes.text().catch(() => '')
    throw new Error(`[LinkedIn] Échec enregistrement upload image (${registerRes.status}). ${detail}`)
  }

  const registerData = await registerRes.json() as {
    value: { asset: string; uploadMechanism: { 'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': { uploadUrl: string } } }
  }
  const assetUrn: string = registerData.value.asset
  const uploadUrl: string = registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl

  // Step 2: fetch image binary
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) throw new Error(`[LinkedIn] Impossible de télécharger l'image : ${imageUrl}`)
  const imgBuffer = Buffer.from(await imgRes.arrayBuffer())
  const contentType = imgRes.headers.get('content-type') ?? 'image/jpeg'

  // Step 3: upload binary
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: imgBuffer,
  })
  if (!putRes.ok) {
    const detail = await putRes.text().catch(() => '')
    throw new Error(`[LinkedIn] Échec upload binaire image (${putRes.status}). ${detail}`)
  }

  return assetUrn
}

function buildUgcPost(text: string, organizationId: string, assetUrn?: string) {
  const author = `urn:li:organization:${organizationId}`

  if (assetUrn) {
    return {
      author,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text },
          shareMediaCategory: 'IMAGE',
          media: [{ status: 'READY', media: assetUrn }],
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }
  }

  return {
    author,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  }
}
