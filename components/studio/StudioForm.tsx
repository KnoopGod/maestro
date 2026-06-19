'use client'
import { useState, useEffect, useRef, useTransition } from 'react'
import Link from 'next/link'
import { Sparkles, Loader2, Target, TrendingUp } from 'lucide-react'
import type { Client } from '@/types/client'
import { BUSINESS_OBJECTIVES, BUSINESS_TARGET_DELAYS, CONVERSION_CHANNELS } from '@/types/client'
import type { Post } from '@/types/post'
import type { ClientAsset } from '@/types/asset'
import { PostIdeasPanel } from '@/components/studio/PostIdeasPanel'
import type { PostIdea } from '@/lib/agents/planner'
import type { Platform, ContentType, GenerationResult, BriefFields, JobProgress } from '@/lib/studio/types'
import { createLoadedPostResult, createInitialBriefFields, composeStructuredBrief } from '@/lib/studio/brief-utils'
import { pollJob, failureMessage } from '@/lib/studio/poll-job'
import { ClientSelectorCard } from './ClientSelectorCard'
import { BriefCard } from './BriefCard'
import { PlatformsCard } from './PlatformsCard'
import { ContentTypeCard } from './ContentTypeCard'
import { ImageVisualCard } from './ImageVisualCard'
import { CtaFacebookSection } from './CtaFacebookSection'
import { AgentWorkPlan } from './AgentWorkPlan'
import { StudioResultPanel } from './StudioResultPanel'

interface ClientDaStatus { active: boolean; summary?: string }

export function StudioForm({
  clients,
  initialClientId,
  initialPost,
  initialPillar,
  clientDaStatus,
  cloneFromPost,
}: {
  clients: Client[]
  initialClientId?: string
  initialPost?: Post
  initialPillar?: string
  clientDaStatus?: Record<string, ClientDaStatus>
  /** Pre-fill brief/platforms/pillar from this post but start with blank result (clone as template). */
  cloneFromPost?: Post
}) {
  const templateSource = cloneFromPost ?? initialPost
  const [clientId, setClientId] = useState(initialClientId || clients[0]?.id || '')
  const [briefFields, setBriefFields] = useState<BriefFields>(() => createInitialBriefFields(templateSource?.brief, initialPillar))
  const [visualPrompt, setVisualPrompt] = useState(initialPost?.imagePrompt || '')
  const [platforms, setPlatforms] = useState<Platform[]>(
    templateSource?.platforms.filter((p): p is Platform => ['instagram', 'facebook', 'tiktok', 'linkedin'].includes(p)) ?? ['instagram']
  )
  const initialContentType = templateSource?.contentType ?? 'photo'
  const [contentType, setContentType] = useState<ContentType>(initialContentType)

  const [result, setResult] = useState<GenerationResult | null>(
    initialPost && !cloneFromPost ? createLoadedPostResult(initialPost) : null
  )
  const [error, setError] = useState<string | null>(null)
  const [regenInstruction, setRegenInstruction] = useState('')
  const [isPending, startTransition] = useTransition()

  const [isGenerating, setIsGenerating] = useState(false)
  const [jobProgress, setJobProgress] = useState<JobProgress | null>(null)
  const pollAbortRef = useRef<AbortController | null>(null)

  const [imageMode, setImageMode] = useState<'generate' | 'library'>('generate')
  const [selectedAsset, setSelectedAsset] = useState<ClientAsset | null>(null)
  const [clientAssets, setClientAssets] = useState<ClientAsset[]>([])
  const [assetsLoading, setAssetsLoading] = useState(false)

  const [aiDirective, setAiDirective] = useState<GenerationResult['directive'] | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [templateCategory, setTemplateCategory] = useState<string | null>(null)

  const [ctaType, setCtaType] = useState<string>('')
  const [ctaUrl, setCtaUrl] = useState<string>('')
  const [selectedPillar, setSelectedPillar] = useState<string>(initialPillar ?? cloneFromPost?.pillar ?? initialPost?.pillar ?? '')

  const selectedClient = clients.find(c => c.id === clientId)
  const selectedDa = clientDaStatus?.[clientId]
  const brief = composeStructuredBrief(briefFields)
  const busy = isPending || isGenerating

  function updateBriefField(key: keyof BriefFields, value: string) {
    setBriefFields(prev => ({ ...prev, [key]: value }))
  }

  useEffect(() => () => pollAbortRef.current?.abort(), [])

  useEffect(() => {
    if (!clientId || imageMode !== 'library') return
    let cancelled = false
    fetch(`/api/clients/${clientId}/assets`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        const assets = Array.isArray(d.assets) ? d.assets as ClientAsset[] : []
        setClientAssets(assets.filter(a => contentType === 'reel' ? a.type === 'video' : a.type === 'image' || a.type === 'logo'))
      })
      .catch(() => { if (!cancelled) setClientAssets([]) })
      .finally(() => { if (!cancelled) setAssetsLoading(false) })
    return () => { cancelled = true }
  }, [clientId, imageMode, contentType])

  function applyIdea(idea: PostIdea) {
    setBriefFields(prev => ({ ...prev, subject: idea.brief }))
    const valid: Platform[] = idea.platforms.filter((p): p is Platform =>
      ['instagram', 'facebook', 'tiktok', 'linkedin'].includes(p)
    )
    if (valid.length > 0) setPlatforms(valid)
  }

  async function handleSuggestBrief() {
    if (!clientId) return
    setAiLoading(true)
    setAiDirective(null)
    try {
      const res = await fetch(`/api/studio/suggest-brief?clientId=${clientId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAiDirective(data.directive)
      setBriefFields(prev => ({ ...prev, subject: data.directive.enrichedBrief }))
    } catch (err) {
      console.error('suggest-brief error:', err)
    } finally {
      setAiLoading(false)
    }
  }

  const togglePlatform = (p: Platform) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  const selectContentType = (type: ContentType) => {
    setContentType(type)
    setSelectedAsset(null)
  }

  function handleClientChange(id: string) {
    setClientId(id)
    setSelectedAsset(null)
    if (imageMode === 'library') setAssetsLoading(true)
  }

  function handleSwitchToLibrary() {
    setImageMode('library')
    setSelectedAsset(null)
    setAssetsLoading(true)
  }

  function handleSwitchToGenerate() {
    setImageMode('generate')
    setSelectedAsset(null)
  }

  const handleGenerate = () => {
    setError(null)
    setResult(null)
    setJobProgress(null)

    pollAbortRef.current?.abort()
    const controller = new AbortController()
    pollAbortRef.current = controller
    setIsGenerating(true)

    void (async () => {
      try {
        const res = await fetch('/api/studio/generate-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            clientId,
            brief,
            platforms,
            contentType,
            visualPrompt: visualPrompt || undefined,
            imageAssetId: imageMode === 'library' && selectedAsset ? selectedAsset.id : undefined,
            imageAssetUrl: imageMode === 'library' && selectedAsset ? selectedAsset.url : undefined,
            ctaType: ctaType || undefined,
            ctaUrl: ctaUrl || undefined,
            pillar: selectedPillar || undefined,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur génération')
        if (!data.jobId) throw new Error('Job de génération non créé')

        const final = await pollJob(data.jobId, {
          signal: controller.signal,
          onProgress: setJobProgress,
        })

        if (final.status === 'failed') throw new Error(failureMessage(final))
        if (!final.postId) throw new Error('Post introuvable après génération')

        const postRes = await fetch(`/api/posts/${final.postId}`, { signal: controller.signal })
        const postData = await postRes.json()
        if (!postRes.ok) throw new Error(postData.error || 'Post introuvable après génération')
        setResult(createLoadedPostResult(postData.post))
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        if (pollAbortRef.current === controller) pollAbortRef.current = null
        setIsGenerating(false)
        setJobProgress(null)
      }
    })()
  }

  async function regenerateTextOnly() {
    if (!result?.post.id) return
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/posts/${result.post.id}/regenerate-caption`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ instruction: regenInstruction.trim() || undefined }),
        })
        setRegenInstruction('')
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur régénération texte')
        setResult(prev => prev ? {
          ...prev,
          post: data.post,
          captions: data.captions,
          reasoning: data.reasoning,
          cost: data.cost,
          tokensUsed: data.tokensUsed,
          model: data.model,
        } : prev)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur régénération texte')
      }
    })
  }

  function mergeUpdatedPost(post: Post) {
    setResult(prev => prev ? {
      ...prev,
      post,
      captions: prev.captions.map(caption => ({
        ...caption,
        caption: post.caption,
        hashtags: post.hashtags,
        hook: post.hook ?? caption.hook,
        cta: post.cta ?? caption.cta,
        characterCount: post.caption.length,
      })),
    } : prev)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="col-span-1 lg:col-span-5 space-y-4">
        <ClientSelectorCard
          clients={clients}
          clientId={clientId}
          selectedClient={selectedClient}
          selectedDa={selectedDa}
          initialPost={initialPost}
          onClientChange={handleClientChange}
        />

        {selectedClient && (
          <BusinessMissionCard client={selectedClient} />
        )}

        <PostIdeasPanel clientId={clientId || null} onPick={applyIdea} />

        <BriefCard
          clientId={clientId}
          aiLoading={aiLoading}
          aiDirective={aiDirective}
          briefFields={briefFields}
          brief={brief}
          templateCategory={templateCategory}
          onSuggestBrief={handleSuggestBrief}
          onUpdateField={updateBriefField}
          onApplyTemplate={text => setBriefFields(prev => ({ ...prev, subject: text }))}
          onSetTemplateCategory={setTemplateCategory}
        />

        {selectedClient?.strategy?.contentPillars && selectedClient.strategy.contentPillars.length > 0 && (
          <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-gray-500">
              Pilier de contenu <span className="text-gray-600 normal-case">(optionnel — sinon auto)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selectedClient.strategy.contentPillars.map(pillar => (
                <button
                  key={pillar}
                  type="button"
                  onClick={() => setSelectedPillar(prev => prev === pillar ? '' : pillar)}
                  title={selectedPillar === pillar ? `Désélectionner le pilier "${pillar}"` : `Cibler le pilier "${pillar}"`}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selectedPillar === pillar
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-gray-950 border-gray-700 text-gray-400 hover:border-purple-600 hover:text-purple-300'
                  }`}
                >
                  {pillar}
                </button>
              ))}
            </div>
          </div>
        )}

        <PlatformsCard platforms={platforms} onToggle={togglePlatform} />

        <ContentTypeCard contentType={contentType} onSelect={selectContentType} />

        <ImageVisualCard
          imageMode={imageMode}
          contentType={contentType}
          visualPrompt={visualPrompt}
          assetsLoading={assetsLoading}
          clientAssets={clientAssets}
          selectedAsset={selectedAsset}
          clientId={clientId}
          onSwitchToGenerate={handleSwitchToGenerate}
          onSwitchToLibrary={handleSwitchToLibrary}
          onAssetToggle={asset => setSelectedAsset(prev => prev?.id === asset.id ? null : asset)}
          onVisualPromptChange={setVisualPrompt}
        />

        {platforms.includes('facebook') && (
          <CtaFacebookSection
            ctaType={ctaType}
            ctaUrl={ctaUrl}
            onCtaTypeChange={setCtaType}
            onCtaUrlChange={setCtaUrl}
          />
        )}

        {/* Generate button — contextual help when disabled */}
        {(() => {
          const noAsset = imageMode === 'library' && !selectedAsset
          const wrongAssetType = contentType === 'reel' && selectedAsset?.type !== 'video'
          const noPlatform = platforms.length === 0
          const blockReason = noAsset
            ? 'Sélectionnez un visuel dans la bibliothèque pour continuer.'
            : wrongAssetType
            ? 'Pour un Reel, sélectionnez une vidéo (pas une image).'
            : noPlatform
            ? 'Choisissez au moins une plateforme de publication.'
            : null
          return (
            <>
              {blockReason && !busy && (
                <p className="text-xs text-amber-400/80 text-center bg-amber-950/20 border border-amber-800/30 rounded-lg px-3 py-2">
                  {blockReason}
                </p>
              )}
              <button
                onClick={handleGenerate}
                disabled={!clientId || noPlatform || busy || noAsset || wrongAssetType}
                title="Lancer les agents IA : analyse client → rédaction captions → génération image → contrôle qualité"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Création du post complet...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Générer post complet</>
                )}
              </button>
              {busy && (
                <p className="text-center text-[11px] text-gray-400">
                  La génération prend entre 30 et 60 secondes — ne fermez pas cette page.
                </p>
              )}
            </>
          )
        })()}

        <div className="text-center text-[11px] text-gray-600">
          4 agents IA en séquence · analyse · rédaction · image · contrôle qualité
        </div>

        <AgentWorkPlan
          selectedClient={selectedClient}
          brief={brief}
          visualPrompt={visualPrompt}
          platforms={platforms}
          contentType={contentType}
          imageMode={imageMode}
          selectedAsset={selectedAsset}
          result={result}
        />
      </div>

      <StudioResultPanel
        result={result}
        error={error}
        isPending={busy}
        progress={jobProgress}
        selectedClient={selectedClient}
        clientId={clientId}
        ctaType={ctaType}
        ctaUrl={ctaUrl}
        regenInstruction={regenInstruction}
        onRegenInstructionChange={setRegenInstruction}
        onRegenerateText={regenerateTextOnly}
        onRegenerateAll={handleGenerate}
        onPostUpdated={mergeUpdatedPost}
      />
    </div>
  )
}

function BusinessMissionCard({ client }: { client: Client }) {
  const profile = client.businessProfile
  if (!profile) {
    return (
      <div className="rounded-xl border border-amber-800/30 bg-amber-950/20 p-4">
        <div className="flex items-start gap-3">
          <Target className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
          <div>
            <div className="text-sm font-semibold text-white">Mission business à compléter</div>
            <p className="mt-1 text-xs leading-relaxed text-amber-100/70">
              Ajoute l&apos;objectif commercial du client pour que le post serve une action mesurable : réservation, appel, DM, avis Google ou vente d&apos;offre.
            </p>
            <Link href={`/clients/${client.id}/edit`} className="mt-2 inline-flex text-xs font-medium text-amber-200 hover:underline">
              Compléter le profil business →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const objective = BUSINESS_OBJECTIVES[profile.priorityObjective]?.label ?? profile.priorityObjective
  const delay = BUSINESS_TARGET_DELAYS[profile.targetDelay]?.label ?? profile.targetDelay
  const channels = profile.conversionChannels.map(channel => CONVERSION_CHANNELS[channel]?.label ?? channel).join(', ')
  const offers = profile.mainOffers.length ? profile.mainOffers.slice(0, 3).join(', ') : 'Offre à préciser'

  return (
    <div className="rounded-xl border border-emerald-800/30 bg-gradient-to-br from-emerald-950/25 to-gray-950/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-300" />
          <div className="text-sm font-semibold text-white">Mission business du post</div>
        </div>
        <Link href={`/clients/${client.id}/edit`} className="text-[11px] text-emerald-200/80 hover:underline">
          Modifier →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-2 text-xs">
        <MissionRow label="Objectif" value={`${objective} · ${delay}`} />
        <MissionRow label="Offres" value={offers} />
        <MissionRow label="Conversion" value={channels || 'Canal à préciser'} />
        {profile.offDays.length > 0 && <MissionRow label="Jours creux" value={profile.offDays.join(', ')} />}
      </div>
    </div>
  )
}

function MissionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-emerald-900/30 bg-gray-950/35 px-3 py-2">
      <span className="text-[10px] uppercase tracking-wider text-emerald-500/80">{label}</span>
      <span className="text-right text-gray-200">{value}</span>
    </div>
  )
}
