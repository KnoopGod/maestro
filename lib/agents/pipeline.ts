import type { Client } from '@/types/client'
import type { Post, PostContentType, PostPlatform, SupervisorReview } from '@/types/post'
import { getVisualIdentity } from '@/lib/db/queries/assets'
import { createPost, getPost, listPosts, setPostStatus, setSupervisorReview } from '@/lib/db/queries/posts'
import { runAccountDirector, type AccountDirective } from '@/lib/agents/account-director'
import { generateCaption, type GeneratedCaption } from '@/lib/agents/social-expert'
import { generateAndStoreImage } from '@/lib/agents/image-generator'
import { supervisePost } from '@/lib/agents/supervisor'
import { buildImpactAnalysis, scoreImpact } from '@/lib/agents/impact-scorer'
import { withTracking, skipTracking } from '@/lib/agents/tracking'

function engagementRate(post: Post): number {
  if (!post.metaInsights.length) return 0
  const total = post.metaInsights.reduce((sum, i) => {
    const reach = i.reach ?? 0
    if (reach === 0) return sum
    const eng = ((i.likes ?? 0) + (i.comments ?? 0) + (i.shares ?? 0)) / reach * 100
    return sum + eng
  }, 0)
  return parseFloat((total / post.metaInsights.length).toFixed(2))
}

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
  skipImage?: boolean
  existingAsset?: { id: string; url: string }
  ctaType?: string
  ctaUrl?: string
  /** ID du job de tracking (optionnel — pas de tracking si absent). */
  jobId?: string
}): Promise<PipelineResult> {
  const { client, userBrief, platforms, contentType = 'photo', skipImage = false, existingAsset, ctaType, ctaUrl, jobId } = input

  // Helper : wrap avec tracking si jobId fourni, sinon appel direct
  function track<T>(
    fn: () => Promise<T>,
    opts: { agent: string; sequence: number; taskLabel: string },
    meta?: Parameters<typeof withTracking<T>>[2]
  ): Promise<T> {
    if (!jobId) return fn()
    return withTracking(fn, { jobId, ...opts }, meta)
  }

  // ── Learning loop : charger les top performers avant Account Director ────────
  const publishedPosts = await listPosts({ clientId: client.id, status: 'published', limit: 30 })
  const postsWithInsights = publishedPosts
    .filter(p => p.metaInsights.length > 0)
    .map(p => ({ ...p, _engRate: engagementRate(p) }))
    .sort((a, b) => b._engRate - a._engRate)

  const topPosts = postsWithInsights.slice(0, 3)
  const allRecentForAD = publishedPosts.slice(0, 10)

  // ── Étape 1 : Account Director ─────────────────────────────────────────────
  const account = await track(
    () => runAccountDirector({ client, userBrief, recentPosts: allRecentForAD, topPosts, runAt: new Date().toISOString() }),
    { agent: 'account-director', sequence: 1, taskLabel: 'Analyse du profil client et préparation du brief' },
    {
      onComplete: r => ({
        outputSummary: `Brief enrichi — priorité : ${r.directive.priorityPillar ?? 'contenu standard'}`,
        outputData: { enrichedBrief: r.directive.enrichedBrief, priorityPillar: r.directive.priorityPillar },
        cost: r.cost,
      }),
    }
  )
  const effectiveBrief = account.directive.enrichedBrief

  // ── Étape 2 : Social Expert ────────────────────────────────────────────────
  const text = await track(
    () => generateCaption({ client, brief: effectiveBrief, platforms, contentType, topPosts: topPosts.slice(0, 2) }),
    { agent: 'social-expert', sequence: 2, taskLabel: `Rédaction des captions pour ${platforms.join(', ')}` },
    {
      onComplete: r => ({
        outputSummary: `${r.captions.length} caption(s) — ${r.captions[0]?.characterCount ?? 0} caractères, ${r.captions[0]?.hashtags.length ?? 0} hashtags`,
        outputData: { captionCount: r.captions.length, platforms, hook: r.captions[0]?.hook },
        cost: r.cost,
      }),
    }
  )

  const primaryCaption = text.captions[0]
  if (!primaryCaption) throw new Error('Aucune caption générée')

  const identity = await getVisualIdentity(client.id)
  let image: { assetId?: string; url?: string; prompt?: string; cost: number } = { cost: 0 }

  // ── Étape 3 : Visual Director ──────────────────────────────────────────────
  if (existingAsset) {
    image = { assetId: existingAsset.id, url: existingAsset.url, cost: 0 }
    if (jobId) await skipTracking(jobId, 'visual-director', 3, 'Génération du visuel', 'Asset sélectionné depuis la bibliothèque')
  } else if (!skipImage) {
    const imageResult = await track(
      () => generateAndStoreImage({ client, brief: effectiveBrief, caption: primaryCaption.caption, visualIdentity: identity }),
      { agent: 'visual-director', sequence: 3, taskLabel: 'Génération du visuel avec la DA du client' },
      {
        onComplete: r => ({
          outputSummary: `Image générée${identity?.stylePrompt ? ' avec Direction Artistique' : ''} — ${r.prompt?.substring(0, 80) ?? ''}`,
          outputData: { hasDA: !!identity?.stylePrompt, assetId: r.assetId },
          cost: r.cost,
        }),
        onError: () => ({ errorMessage: 'Erreur génération image — post créé sans visuel', errorAction: 'retry' }),
      }
    ).catch(err => {
      console.error('Erreur génération image non bloquante:', err)
      return { cost: 0 as number, assetId: undefined, url: undefined, prompt: undefined }
    })
    image = imageResult
  } else {
    if (jobId) await skipTracking(jobId, 'visual-director', 3, 'Génération du visuel', 'Visuel ignoré (mode texte seul)')
  }

  // ── Création du post ───────────────────────────────────────────────────────
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
    ctaType: ctaType ?? undefined,
    ctaUrl: ctaUrl ?? undefined,
    imageAssetId: image.assetId,
    imageUrl: image.url,
    imagePrompt: image.prompt,
    impactScore,
    impactAnalysis: buildImpactAnalysis(impactScore, !!identity?.stylePrompt),
    cost: account.cost + text.cost + image.cost,
    tokensUsed: account.tokensUsed + text.tokensUsed,
  })

  // ── Étape 4 : Supervisor ───────────────────────────────────────────────────
  let review: SupervisorReview | null = null
  let supervisorCost = 0
  let supervisorTokens = 0
  let supervisorModel: string | null = null

  const supervisorResult = await track(
    () => supervisePost({ client, post }),
    { agent: 'supervisor', sequence: 4, taskLabel: 'Révision qualité et verdict final' },
    {
      onComplete: r => ({
        outputSummary: `Verdict : ${
          r.review.verdict === 'ready' ? '✅ Prêt à publier'
          : r.review.verdict === 'revise' ? '⚠️ Améliorations suggérées'
          : '❌ Bloqué — révision requise'
        } · Score ${impactScore}/100`,
        outputData: { verdict: r.review.verdict, score: impactScore, summary: r.review.summary },
        cost: r.cost,
      }),
      onError: () => ({ errorMessage: 'Erreur supervision — post créé sans révision', errorAction: 'retry' }),
    }
  ).catch(err => {
    console.error('Erreur supervision non bloquante:', err)
    return null
  })

  if (supervisorResult) {
    review = supervisorResult.review
    supervisorCost = supervisorResult.cost
    supervisorTokens = supervisorResult.tokensUsed
    supervisorModel = supervisorResult.model
    await setSupervisorReview(post.id, review)
    if (review.verdict === 'ready') await setPostStatus(post.id, 'ready')
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
