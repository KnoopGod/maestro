import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/db/queries/clients'
import { getPost, updatePostContent } from '@/lib/db/queries/posts'
import { generateAndStoreImage } from '@/lib/agents/image-generator'
import { getVisualIdentity } from '@/lib/db/queries/assets'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const visualPrompt = typeof body.visualPrompt === 'string' ? body.visualPrompt.trim() : undefined

    const post = await getPost(id)
    if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
    if (post.status === 'published') {
      return NextResponse.json({ error: 'Impossible de régénérer l\'image d\'un post déjà publié' }, { status: 400 })
    }

    const client = await getClient(post.clientId)
    if (!client) return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })

    const identity = await getVisualIdentity(client.id)

    const imageResult = await generateAndStoreImage({
      client,
      brief: post.brief,
      caption: post.caption,
      visualIdentity: identity,
      visualPrompt,
      contentType: post.contentType,
    })

    const updated = await updatePostContent(post.id, {
      imageAssetId: imageResult.assetId,
      imageUrl: imageResult.url,
      imagePrompt: imageResult.prompt,
      cost: post.cost + imageResult.cost,
    })

    return NextResponse.json({ post: updated, cost: imageResult.cost })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur régénération image'
    const status = message.includes('OPENAI_API_KEY') ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
