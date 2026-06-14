'use client'
import { useState, useEffect, useRef, useTransition } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import type { Client } from '@/types/client'
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

  const [imageMode, setImageMode] = useState<'generate' | 'library'>(initialContentType === 'reel' ? 'library' : 'generate')
  const [selectedAsset, setSelectedAsset] = useState<ClientAsset | null>(null)
  const [clientAssets, setClientAssets] = useState<ClientAsset[]>([])
  const [assetsLoading, setAssetsLoading] = useState(false)

  const [aiDirective, setAiDirective] = useState<GenerationResult['directive'] | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [templateCategory, setTemplateCategory] = useState<string | null>(null)

  const [ctaType, setCtaType] = useState<string>('')
  const [ctaUrl, setCtaUrl] = useState<string>('')

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
    if (type === 'reel') {
      setImageMode('library')
      if (clientId) setAssetsLoading(true)
    }
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

        <button
          onClick={handleGenerate}
          disabled={!clientId || platforms.length === 0 || busy || (imageMode === 'library' && !selectedAsset) || (contentType === 'reel' && selectedAsset?.type !== 'video')}
          title="Lancer la chaîne d'agents : analyse client, stratégie, rédaction, visuel, scoring puis draft prêt à valider"
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Création du post complet...</>
          ) : (
            <><Sparkles className="w-5 h-5" /> Générer post complet</>
          )}
        </button>

        <div className="text-center text-[11px] text-gray-500">
          Powered by <span className="text-purple-400">Social Expert</span> · Claude Sonnet 4.6
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
