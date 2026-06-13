'use client'
import { useState, useEffect, useTransition } from 'react'
import { Sparkles, Loader2, ImageIcon, Wand2, BrainCircuit, ChevronDown, Film, Check } from 'lucide-react'
import type { Client } from '@/types/client'
import type { Post } from '@/types/post'
import type { ClientAsset } from '@/types/asset'
import { PostIdeasPanel } from '@/components/studio/PostIdeasPanel'
import type { PostIdea } from '@/lib/agents/planner'
import { META_CTA_TYPES, getMetaCtaLabel } from '@/lib/meta-cta-types'
import type { Platform, ContentType, GenerationResult, BriefFields } from '@/lib/studio/types'
import { PLATFORM_INFO, CONTENT_TYPE_INFO } from '@/lib/studio/types'
import { BRIEF_TEMPLATES } from '@/lib/studio/brief-templates'
import { createLoadedPostResult, createInitialBriefFields, composeStructuredBrief } from '@/lib/studio/brief-utils'
import { GuidedBriefField } from './GuidedBriefField'
import { AgentWorkPlan } from './AgentWorkPlan'
import { StudioResultPanel } from './StudioResultPanel'

interface ClientDaStatus {
  active: boolean
  summary?: string
}

export function StudioForm({
  clients,
  initialClientId,
  initialPost,
  initialPillar,
  clientDaStatus,
}: {
  clients: Client[]
  initialClientId?: string
  initialPost?: Post
  initialPillar?: string
  clientDaStatus?: Record<string, ClientDaStatus>
}) {
  const [clientId, setClientId] = useState(initialClientId || clients[0]?.id || '')
  const [briefFields, setBriefFields] = useState<BriefFields>(() => createInitialBriefFields(initialPost?.brief, initialPillar))
  const [visualPrompt, setVisualPrompt] = useState(initialPost?.imagePrompt || '')
  const [platforms, setPlatforms] = useState<Platform[]>(
    initialPost?.platforms.filter((p): p is Platform => ['instagram', 'facebook', 'tiktok', 'linkedin'].includes(p)) ?? ['instagram']
  )
  const initialContentType = initialPost?.contentType ?? 'photo'
  const [contentType, setContentType] = useState<ContentType>(initialContentType)

  const [result, setResult] = useState<GenerationResult | null>(
    initialPost ? createLoadedPostResult(initialPost) : null
  )
  const [error, setError] = useState<string | null>(null)
  const [regenInstruction, setRegenInstruction] = useState('')
  const [isPending, startTransition] = useTransition()

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

  function updateBriefField(key: keyof BriefFields, value: string) {
    setBriefFields(prev => ({ ...prev, [key]: value }))
  }

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

  const handleGenerate = () => {
    setError(null)
    setResult(null)

    startTransition(async () => {
      try {
        const res = await fetch('/api/studio/generate-post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        setResult(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      }
    })
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
      {/* LEFT: Inputs */}
      <div className="col-span-1 lg:col-span-5 space-y-4">
        {/* Client selector */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
          <label className="text-sm font-semibold text-white mb-3 block">👤 Client</label>
          <select
            value={clientId}
            onChange={e => {
              setClientId(e.target.value)
              setSelectedAsset(null)
              if (imageMode === 'library') setAssetsLoading(true)
            }}
            title="Choisir le client dont la stratégie, la DA et les connexions seront utilisées pour générer le post"
            className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name} · {c.city || '—'}
              </option>
            ))}
          </select>

          {selectedClient && (
            <div className="mt-3 space-y-2">
              <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-700/30 text-xs">
                <div className="text-purple-300 font-medium mb-1">Voix de marque chargée :</div>
                <div className="text-gray-300">{selectedClient.brandVoiceTone || 'Non définie'}</div>
              </div>
              <div className={`p-3 rounded-lg border text-xs ${
                selectedDa?.active
                  ? 'bg-emerald-950/30 border-emerald-700/30'
                  : 'bg-amber-950/30 border-amber-700/30'
              }`}>
                <div className={selectedDa?.active ? 'text-emerald-300 font-medium mb-1' : 'text-amber-300 font-medium mb-1'}>
                  {selectedDa?.active ? 'DA active' : 'Aucune DA'}
                </div>
                <div className={selectedDa?.active ? 'text-emerald-100/80' : 'text-amber-100/80'}>
                  {selectedDa?.active
                    ? selectedDa.summary || 'Identité visuelle analysée et disponible pour les agents.'
                    : 'Ajoute ou analyse les médias du client pour guider les visuels IA.'}
                </div>
                {!selectedDa?.active && (
                  <a href={`/clients/${selectedClient.id}/library`} className="mt-2 inline-block text-amber-200 hover:underline">
                    Ouvrir la Library →
                  </a>
                )}
              </div>
            </div>
          )}

          {initialPost && (
            <div className="mt-3 p-3 rounded-lg bg-blue-950/30 border border-blue-700/30 text-xs">
              <div className="text-blue-300 font-medium mb-1">Draft chargé depuis la validation</div>
              <div className="text-gray-300">Post #{initialPost.id} · {initialPost.status}</div>
            </div>
          )}
        </div>

        {/* Strategy Director — post ideas */}
        <PostIdeasPanel clientId={clientId || null} onPick={applyIdea} />

        {/* Brief */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-white">✍️ Ordre pour le post</label>
            <button
              type="button"
              onClick={handleSuggestBrief}
              disabled={!clientId || aiLoading}
              title="Demander à l'Account Director de proposer un brief aligné avec la stratégie du client"
              className="flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-lg bg-purple-900/40 border border-purple-700/40 text-purple-300 hover:bg-purple-800/40 hover:border-purple-500/60 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-mono tracking-wide"
            >
              {aiLoading
                ? <><Loader2 className="w-3 h-3 animate-spin" /> Analyse en cours...</>
                : <><BrainCircuit className="w-3 h-3" /> Brief IA</>
              }
            </button>
          </div>

          {aiDirective && (
            <div className="bg-amber-950/20 border border-amber-800/30 rounded-lg p-3 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[10px] tracking-wider">
                <BrainCircuit className="w-3 h-3" />
                Account Director — {aiDirective.priorityPillar}
              </div>
              <p className="text-gray-300">{aiDirective.rationale}</p>
              <p className="text-amber-300/80">Hook : &ldquo;{aiDirective.hookSuggestion}&rdquo;</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            <GuidedBriefField label="Sujet" value={briefFields.subject} onChange={v => updateBriefField('subject', v)} placeholder="Ex: présenter la guesthouse Pink House et son ambiance tropicale" />
            <GuidedBriefField label="Objectif" value={briefFields.objective} onChange={v => updateBriefField('objective', v)} placeholder="Ex: obtenir des demandes de réservation pour le week-end" />
            <GuidedBriefField label="Ton" value={briefFields.tone} onChange={v => updateBriefField('tone', v)} placeholder="Ex: premium, chaleureux, local, calme" />
            <GuidedBriefField label="À inclure" value={briefFields.includes} onChange={v => updateBriefField('includes', v)} placeholder="Ex: plage proche, piscine, CTA réservation, éviter ton trop touristique" />
          </div>

          <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
            <div className="text-[9px] text-gray-600 font-mono uppercase tracking-wider mb-1">Brief envoyé aux agents</div>
            <p className="text-xs text-gray-400 whitespace-pre-wrap">{brief || 'Complète au moins le sujet pour guider les agents.'}</p>
          </div>

          {/* Template categories */}
          <div className="space-y-2">
            <p className="text-[9px] text-gray-600 font-mono uppercase tracking-wider">Templates rapides</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(BRIEF_TEMPLATES).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setTemplateCategory(templateCategory === cat ? null : cat)}
                  title={`Afficher les modèles rapides pour ${cat}`}
                  className={`text-[10px] px-2.5 py-1 rounded-md border font-mono tracking-wide transition-all flex items-center gap-1 ${
                    templateCategory === cat
                      ? 'bg-indigo-900/50 border-indigo-600/60 text-indigo-200'
                      : 'bg-gray-800/60 border-gray-700 text-gray-400 hover:bg-gray-700/60 hover:text-gray-200'
                  }`}
                >
                  {cat}
                  <ChevronDown className={`w-3 h-3 transition-transform ${templateCategory === cat ? 'rotate-180' : ''}`} />
                </button>
              ))}
            </div>

            {templateCategory && (
              <div className="grid grid-cols-1 gap-1.5 pt-1">
                {BRIEF_TEMPLATES[templateCategory].map(tpl => (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => { setBriefFields(prev => ({ ...prev, subject: tpl.text })); setTemplateCategory(null) }}
                    title={`Utiliser ce modèle de brief : ${tpl.label}`}
                    className="text-left text-xs px-3 py-2 rounded-lg bg-gray-900/60 border border-gray-700 text-gray-300 hover:border-purple-600/50 hover:bg-purple-950/20 hover:text-purple-200 transition-all"
                  >
                    <span className="font-medium">{tpl.label}</span>
                    <span className="text-gray-500 ml-2 line-clamp-1">{tpl.text.slice(0, 60)}…</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Platforms */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
          <label className="text-sm font-semibold text-white mb-3 block">🎯 Plateformes cibles</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(PLATFORM_INFO) as Platform[]).map(p => {
              const cfg = PLATFORM_INFO[p]
              const active = platforms.includes(p)
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  title={`${active ? 'Retirer' : 'Ajouter'} ${cfg.label} comme plateforme cible du post`}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 ${
                    active ? cfg.color : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <span>{cfg.emoji}</span>
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content type */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
          <label className="text-sm font-semibold text-white mb-3 block">📦 Format Instagram</label>
          <div className="grid grid-cols-3 gap-2">
            {(['photo', 'story', 'reel'] as ContentType[]).map(t => {
              const info = CONTENT_TYPE_INFO[t]
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => selectContentType(t)}
                  title={info.title}
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    contentType === t
                      ? 'bg-purple-600/20 border-purple-600/40 text-purple-300'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {info.label}
                </button>
              )
            })}
          </div>
          <p className="mt-2 text-[11px] text-gray-500">{CONTENT_TYPE_INFO[contentType].note}</p>
        </div>

        {/* Image mode */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
          <label className="text-sm font-semibold text-white mb-3 block">🖼️ Visuel du post</label>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              type="button"
              disabled={contentType === 'reel'}
              onClick={() => { setImageMode('generate'); setSelectedAsset(null) }}
              title={contentType === 'reel' ? 'Un Reel Instagram nécessite une vidéo depuis la Library' : "Créer un nouveau visuel avec l'IA"}
              className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 ${
                imageMode === 'generate'
                  ? 'bg-purple-600/20 border-purple-600/40 text-purple-300'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Wand2 className="w-4 h-4" />
              Générer une image
            </button>
            <button
              type="button"
              onClick={() => { setImageMode('library'); setSelectedAsset(null); setAssetsLoading(true) }}
              title={contentType === 'reel' ? 'Utiliser une vidéo depuis la Library' : 'Utiliser un asset depuis la Library du client'}
              className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 ${
                imageMode === 'library'
                  ? 'bg-blue-600/20 border-blue-600/40 text-blue-300'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              Depuis la bibliothèque
            </button>
          </div>

          {imageMode === 'generate' && (
            <div className="mb-4">
              <label htmlFor="visualPrompt" className="block text-xs text-gray-400 mb-1.5">Prompt image / vidéo</label>
              <textarea
                id="visualPrompt"
                value={visualPrompt}
                onChange={e => setVisualPrompt(e.target.value)}
                rows={3}
                placeholder="Ex: Photo réaliste verticale, piscine turquoise, terrasse tropicale, lumière golden hour..."
                title="Consigne précise donnée au Visual Director pour guider l'image IA"
                className="w-full bg-gray-950/60 border border-gray-800 rounded-lg p-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-purple-500 resize-y"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Ce champ guide uniquement le visuel. Le texte reste piloté par l&apos;ordre du post et la stratégie client.
              </p>
            </div>
          )}

          {imageMode === 'library' && (
            <div>
              {assetsLoading && (
                <div className="flex items-center justify-center py-6 text-gray-500 text-sm gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
                </div>
              )}
              {!assetsLoading && clientAssets.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">
                  {contentType === 'reel' ? 'Aucune vidéo dans la bibliothèque de ce client.' : 'Aucune image dans la bibliothèque de ce client.'}{' '}
                  <a href={clientId ? `/clients/${clientId}/library` : '#'} className="text-purple-400 hover:underline">
                    Uploader des assets →
                  </a>
                </p>
              )}
              {!assetsLoading && clientAssets.length > 0 && (
                <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                  {clientAssets.map(asset => (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => setSelectedAsset(prev => prev?.id === asset.id ? null : asset)}
                      title={`Sélectionner ${asset.originalName}`}
                      className={`relative rounded-lg overflow-hidden aspect-square border-2 transition-all ${
                        selectedAsset?.id === asset.id ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-transparent hover:border-gray-600'
                      }`}
                    >
                      {asset.type === 'video' ? (
                        <div className="relative h-full w-full bg-black">
                          <video src={asset.url} preload="metadata" className="h-full w-full object-cover opacity-80" />
                          <Film className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow" />
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={asset.thumbnailUrl ?? asset.url} alt={asset.originalName} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      )}
                      {selectedAsset?.id === asset.id && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white drop-shadow" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {selectedAsset && (
                <p className="text-xs text-blue-400 mt-2 truncate">✓ Sélectionné : {selectedAsset.originalName}</p>
              )}
            </div>
          )}
        </div>

        {/* CTA Button (Facebook) */}
        {platforms.includes('facebook') && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-indigo-600/60 font-mono tracking-[0.2em] uppercase">{'// CTA FACEBOOK'}</span>
              <span className="text-[8px] text-gray-600 font-mono">— bouton d&apos;action sur la publication</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={ctaType}
                onChange={e => setCtaType(e.target.value)}
                className="col-span-2 sm:col-span-1 bg-gray-900/60 border border-gray-800 text-xs text-gray-300 px-2 py-2 font-mono focus:outline-none focus:border-indigo-600"
              >
                <option value="">Aucun bouton CTA</option>
                {META_CTA_TYPES.map(cta => (
                  <option key={cta.value} value={cta.value}>{cta.emoji} {cta.label}</option>
                ))}
              </select>
              {ctaType && (
                <input
                  type="url"
                  value={ctaUrl}
                  onChange={e => setCtaUrl(e.target.value)}
                  placeholder="https://votre-site.com/reserver"
                  className="col-span-2 bg-gray-900/60 border border-gray-800 text-xs text-gray-300 px-2 py-2 font-mono placeholder:text-gray-700 focus:outline-none focus:border-indigo-600"
                />
              )}
            </div>
            {ctaType && !ctaUrl && (
              <p className="text-[9px] text-amber-500/70 font-mono">⚠ Entrez l&apos;URL de destination pour activer le bouton</p>
            )}
            {ctaType && ctaUrl && (
              <p className="text-[9px] text-emerald-500/60 font-mono">✓ Bouton &ldquo;{getMetaCtaLabel(ctaType)}&rdquo; activé → {ctaUrl.length > 40 ? ctaUrl.substring(0, 40) + '…' : ctaUrl}</p>
            )}
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!clientId || platforms.length === 0 || isPending || (imageMode === 'library' && !selectedAsset) || (contentType === 'reel' && selectedAsset?.type !== 'video')}
          title="Lancer la chaîne d'agents : analyse client, stratégie, rédaction, visuel, scoring puis draft prêt à valider"
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? (
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
        isPending={isPending}
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
