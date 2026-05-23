import type { Client } from '@/types/client'
import type { Post, PostContentType, PostPlatform, SupervisorReview } from '@/types/post'
import { getVisualIdentity } from '@/lib/db/queries/assets'
import { createPost, getPost, setPostStatus, setSupervisorReview } from '@/lib/db/queries/posts'
import { runAccountDirector, type AccountDirective } from '@/lib/agents/account-director'
import { generateCaption, type GeneratedCaption } from '@/lib/agents/social-expert'
import { generateAndStoreImage } from '@/lib/agents/image-generator'
import { supervisePost } from '@/lib/agents/supervisor'
import { buildImpactAnalysis, scoreImpact } from '@/lib/agents/impact-scorer'

export interface PipelineResult {
  post: Post
  directive: AccountDirective
  review: SupervisorReview | null
  captions: GeneratedCaption[]
  reasoning: string
  totalCost: number
  totalTokens: number
  models: string[]
}

export async function runPostPipeline(input: {
  client: Client
  userBrief?: string
  platforms: PostPlatform[]
  contentType?: PostContentType
  /** Si vrai, ignore la génération d'image (texte seul). Défaut : false. */
  skipImage?: boolean
  /** Si fourni, utilise cet asset existant au lieu de générer une image. */
  existingAsset?: { id: string; url: string }
}): Promise<PipelineResult> {
  const { client, userBrief, platforms, contentType = 'photo', skipImage = false, existingAsset } = input
  const account = await runAccountDirector({ client, userBrief })
  const effectiveBrief = account.directive.enrichedBrief
  const text = await generateCaption({ client, brief: effectiveBrief, platforms, contentType })
  const primaryCaption = text.captions[0]

  if (!primaryCaption) {
    throw new Error('Aucune caption générée')
  }

  const identity = await getVisualIdentity(client.id)
  let image: { assetId?: string; url?: string; prompt?: string; cost: number } = { cost: 0 }

  if (existingAsset) {
    image = { assetId: existingAsset.id, url: existingAsset.url, cost: 0 }
  } else if (!skipImage) {
    try {
      image = await generateAndStoreImage({
        client,
        brief: effectiveBrief,
        caption: primaryCaption.caption,
        visualIdentity: identity,
      })
    } catch (err) {
      console.error('Erreur génération image non bloquante:', err)
    }
  }

  const impactScore = scoreImpact({
    caption: primaryCaption.caption,
    hashtags: primaryCaption.hashtags,
    hasVisualIdentity: !!identity?.stylePrompt,
  })

  const post = await createPost({
    clientId: client.id,
    platforms,
    contentType,
    brief: effectiveBrief,
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
    cost: account.cost + text.cost + image.cost,
    tokensUsed: account.tokensUsed + text.tokensUsed,
  })

  let review: SupervisorReview | null = null
  let supervisorCost = 0
  let supervisorTokens = 0
  let supervisorModel: string | null = null

  try {
    const supervisor = await supervisePost({ client, post })
    review = supervisor.review
    supervisorCost = supervisor.cost
    supervisorTokens = supervisor.tokensUsed
    supervisorModel = supervisor.model
    await setSupervisorReview(post.id, review)
    if (review.verdict === 'ready') {
      await setPostStatus(post.id, 'ready')
    }
  } catch (err) {
    console.error('Erreur supervision non bloquante:', err)
  }

  const finalPost = await getPost(post.id)
  if (!finalPost) throw new Error('Post créé introuvable après supervision')

  return {
    post: finalPost,
    directive: account.directive,
    review,
    captions: text.captions,
    reasoning: text.reasoning,
    totalCost: parseFloat((account.cost + text.cost + image.cost + supervisorCost).toFixed(6)),
    totalTokens: account.tokensUsed + text.tokensUsed + supervisorTokens,
    models: [account.model, text.model, image.prompt ? 'gpt-image-1' : 'image-skipped', supervisorModel].filter(Boolean) as string[],
  }
}
