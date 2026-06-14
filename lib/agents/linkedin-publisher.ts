export interface LinkedInPublishInput {
  organizationId: string
  accessToken: string
  caption: string
  hashtags: string[]
  imageUrl?: string
  imageBuffer?: Buffer
}

export interface LinkedInPublishResult {
  postId: string
  url?: string
}

const LINKEDIN_API = 'https://api.linkedin.com/v2'

export async function publishToLinkedIn(input: LinkedInPublishInput): Promise<LinkedInPublishResult> {
  const owner = `urn:li:organization:${input.organizationId}`
  const text = buildLinkedInText(input.caption, input.hashtags)
  const asset = input.imageBuffer || input.imageUrl
    ? await uploadImage(input, owner)
    : undefined

  const body = {
    author: owner,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: asset ? 'IMAGE' : 'NONE',
        ...(asset ? {
          media: [{
            status: 'READY',
            description: { text: input.caption.slice(0, 200) },
            media: asset,
            title: { text: 'Publication' },
          }],
        } : {}),
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  }

  const res = await fetch(`${LINKEDIN_API}/ugcPosts`, {
    method: 'POST',
    headers: linkedInHeaders(input.accessToken),
    body: JSON.stringify(body),
  })

  const responseText = await res.text()
  if (!res.ok) throw linkedInError(res.status, responseText)

  const data = safeJson(responseText) as { id?: string }
  const postId = data.id || res.headers.get('x-restli-id')
  if (!postId) throw new Error('LinkedIn : publication créée mais ID introuvable')

  return { postId }
}

function buildLinkedInText(caption: string, hashtags: string[]) {
  const tags = hashtags
    .map(tag => tag.replace(/^#/, '').trim())
    .filter(Boolean)
    .map(tag => `#${tag}`)
    .join(' ')
  return tags ? `${caption}\n\n${tags}` : caption
}

async function uploadImage(input: LinkedInPublishInput, owner: string): Promise<string> {
  const registerRes = await fetch(`${LINKEDIN_API}/assets?action=registerUpload`, {
    method: 'POST',
    headers: linkedInHeaders(input.accessToken),
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner,
        serviceRelationships: [{
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent',
        }],
      },
    }),
  })

  const registerText = await registerRes.text()
  if (!registerRes.ok) throw linkedInError(registerRes.status, registerText)

  const registered = safeJson(registerText) as {
    value?: {
      asset?: string
      uploadMechanism?: {
        'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'?: {
          uploadUrl?: string
        }
      }
    }
  }
  const uploadUrl = registered.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl
  const asset = registered.value?.asset
  if (!uploadUrl || !asset) throw new Error('LinkedIn : réponse registerUpload invalide')

  const imageBuffer = input.imageBuffer ?? await fetchImageBuffer(input.imageUrl)
  const arrayBuffer = imageBuffer.buffer.slice(
    imageBuffer.byteOffset,
    imageBuffer.byteOffset + imageBuffer.byteLength
  ) as ArrayBuffer
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${input.accessToken}` },
    body: arrayBuffer,
  })
  if (!putRes.ok) throw linkedInError(putRes.status, await putRes.text())

  return asset
}

async function fetchImageBuffer(imageUrl?: string): Promise<Buffer> {
  if (!imageUrl) throw new Error('LinkedIn : imageUrl manquant')
  const res = await fetch(imageUrl)
  if (!res.ok) throw new Error(`LinkedIn : image inaccessible (${res.status})`)
  return Buffer.from(await res.arrayBuffer())
}

function linkedInHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'X-Restli-Protocol-Version': '2.0.0',
  }
}

function linkedInError(status: number, detail: string) {
  if (status === 401) return new Error(`LinkedIn : token expiré ou invalide. Détails : ${detail}`)
  if (status === 422) return new Error(`LinkedIn : contenu refusé. Détails : ${detail}`)
  return new Error(`LinkedIn API erreur (${status}) : ${detail}`)
}

function safeJson(text: string): unknown {
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return {}
  }
}
