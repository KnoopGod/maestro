import { NextRequest, NextResponse } from 'next/server'
import { getClient } from '@/lib/db/queries/clients'
import { getVisualIdentity } from '@/lib/db/queries/assets'
import { createPost } from '@/lib/db/queries/posts'
import { generateCaption, type Platform } from '@/lib/agents/social-expert'
import { generateAndStoreImage } from '@/lib/agents/image-generator'

export async function POST(req: NextRequest) {
  try {
    const { clientId, brief, platforms, contentType = 'photo' } = await req.json()

    if (!clientId || !brief || !Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json({ error: 'clientId, brief et platforms sont requis' }, { status: 400 })
    }

    const client = await getClient(clientId)
    if (!client) {
      return NextResponse.json({ error: 'Client introuvable' }, { status: 404 })
    }

    const text = await generateCaption({
      client,
      brief,
      platforms: platforms as Platform[],
      contentType,
    })

    const primaryCaption = text.captions[0]
    if (!primaryCaption) {
      return NextResponse.json({ error: 'Aucune caption générée' }, { status: 500 })
    }

    const identity = await getVisualIdentity(client.id)
    const image = await generateAndStoreImage({
      client,
      brief,
      caption: primaryCaption.caption,
      visualIdentity: identity,
    })

    const impactScore = scoreImpact({
      caption: primaryCaption.caption,
      hashtags: primaryCaption.hashtags,
      hasVisualIdentity: !!identity?.stylePrompt,
    })

    const post = await createPost({
      clientId: client.id,
      platforms,
      contentType,
      brief,
      reasoning: text.reasoning,
      caption: primaryCaption.caption,
      hashtags: primaryCaption.hashtags,
      hook: primaryCaption.hook,
      cta: primaryCaption.cta,
      imageAssetId: image.assetId,
      imageUrl: image.url,
      imagePrompt: image.prompt,
      impactScore,
      impactAnalysis: buildImpactAnalysis(impactScore, !!identity?.stylePrompt),
      cost: text.cost + image.cost,
      tokensUsed: text.tokensUsed,
    })

    return NextResponse.json({
      post,
      captions: text.captions,
      reasoning: text.reasoning,
      cost: text.cost + image.cost,
      tokensUsed: text.tokensUsed,
      model: text.model,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur génération post complet'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function scoreImpact(input: {
  caption: string
  hashtags: string[]
  hasVisualIdentity: boolean
}) {
  let score = 55
  if (input.caption.length >= 120 && input.caption.length <= 450) score += 12
  if (input.hashtags.length >= 4 && input.hashtags.length <= 9) score += 10
  if (/[?]/.test(input.caption)) score += 5
  if (/réserv|venez|découvr|ce soir|week-end/i.test(input.caption)) score += 8
  if (input.hasVisualIdentity) score += 10
  return Math.min(score, 95)
}

function buildImpactAnalysis(score: number, hasVisualIdentity: boolean) {
  const da = hasVisualIdentity
    ? 'La direction artistique du client a été injectée dans la génération.'
    : "Aucune direction artistique analysée n'est encore disponible pour ce client."
  return `Score prédictif ${score}/100. ${da} Le post combine hook, CTA, hashtags et visuel généré pour maximiser l'impact social.`
}
