'use client'
import { useState, useEffect, useTransition } from 'react'
import { Sparkles, Loader2, AlertCircle, RefreshCw, Copy, Check, Heart, MessageCircle, Send, Bookmark, Target, ImageIcon, Wand2 } from 'lucide-react'
import type { Client } from '@/types/client'
import type { Post, SupervisorReview } from '@/types/post'
import type { ClientAsset } from '@/types/asset'
import { PostIdeasPanel } from '@/components/studio/PostIdeasPanel'
import { PostActions, PostSupervisor } from '@/components/posts/PostActions'
import type { PostIdea } from '@/lib/agents/planner'
import type { AccountDirective } from '@/lib/agents/account-director'

type Platform = 'instagram' | 'facebook' | 'tiktok' | 'linkedin'
type ContentType = 'photo' | 'reel' | 'story'

interface GeneratedCaption {
  platform: Platform
  caption: string
  hashtags: string[]
  hook: string
  cta: string
  characterCount: number
}

interface GenerationResult {
  post: Post
  reasoning: string
  captions: GeneratedCaption[]
  cost: number
  tokensUsed: number
  model: string
  review?: SupervisorReview
  directive?: AccountDirective
}

const PLATFORM_INFO: Record<Platform, { label: string; emoji: string; color: string }> = {
  instagram: { label: 'Instagram', emoji: '📷', color: 'bg-pink-600/20 border-pink-600/40 text-pink-300' },
  facebook:  { label: 'Facebook',  emoji: '👍', color: 'bg-blue-600/20 border-blue-600/40 text-blue-300' },
  tiktok:    { label: 'TikTok',    emoji: '🎵', color: 'bg-purple-600/20 border-purple-600/40 text-purple-300' },
  linkedin:  { label: 'LinkedIn',  emoji: '💼', color: 'bg-sky-600/20 border-sky-600/40 text-sky-300' },
}

export function StudioForm({
  clients,
  initialClientId,
  initialPost,
  initialPillar,
}: {
  clients: Client[]
  initialClientId?: string
  initialPost?: Post
  initialPillar?: string
}) {
  const [clientId, setClientId] = useState(initialClientId || clients[0]?.id || '')
  const [brief, setBrief] = useState(
    initialPost?.brief || (initialPillar ? `Créer un post autour du pilier : ${initialPillar}` : '')
  )
  const [platforms, setPlatforms] = useState<Platform[]>(
    initialPost?.platforms.filter((p): p is Platform => ['instagram', 'facebook', 'tiktok', 'linkedin'].includes(p)) ?? ['instagram']
  )
  const [contentType, setContentType] = useState<ContentType>(initialPost?.contentType ?? 'photo')

  const [result, setResult] = useState<GenerationResult | null>(
    initialPost ? createLoadedPostResult(initialPost) : null
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [imageMode, setImageMode] = useState<'generate' | 'library'>('generate')
  const [selectedAsset, setSelectedAsset] = useState<ClientAsset | null>(null)
  const [clientAssets, setClientAssets] = useState<ClientAsset[]>([])
  const [assetsLoading, setAssetsLoading] = useState(false)

  const selectedClient = clients.find(c => c.id === clientId)

  useEffect(() => {
    if (!clientId || imageMode !== 'library') return
    let cancelled = false
    fetch(`/api/clients/${clientId}/assets`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return
        const assets = Array.isArray(d.assets) ? d.assets as ClientAsset[] : []
        setClientAssets(assets.filter(a => a.type === 'image' || a.type === 'logo'))
      })
      .catch(() => { if (!cancelled) setClientAssets([]) })
      .finally(() => { if (!cancelled) setAssetsLoading(false) })
    return () => { cancelled = true }
  }, [clientId, imageMode])

  function applyIdea(idea: PostIdea) {
    setBrief(idea.brief)
    // Map idea platforms (PostPlatform) into Studio's local Platform type
    const valid: Platform[] = idea.platforms.filter((p): p is Platform =>
      ['instagram', 'facebook', 'tiktok', 'linkedin'].includes(p)
    )
    if (valid.length > 0) setPlatforms(valid)
  }

  const togglePlatform = (p: Platform) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
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
            imageAssetId: imageMode === 'library' && selectedAsset ? selectedAsset.id : undefined,
            imageAssetUrl: imageMode === 'library' && selectedAsset ? selectedAsset.url : undefined,
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
            className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name} · {c.city || '—'}
              </option>
            ))}
          </select>

          {selectedClient && (
            <div className="mt-3 p-3 rounded-lg bg-purple-950/30 border border-purple-700/30 text-xs">
              <div className="text-purple-300 font-medium mb-1">Voix de marque chargée :</div>
              <div className="text-gray-300">{selectedClient.brandVoiceTone || 'Non définie'}</div>
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
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
          <label className="text-sm font-semibold text-white mb-3 block">✍️ Brief du post</label>
          <textarea
            value={brief}
            onChange={e => setBrief(e.target.value)}
            rows={4}
            placeholder="Décrivez ce que vous voulez communiquer...&#10;&#10;Ex: Pizza signature de retour ce weekend, mettre en avant les ingrédients premium"
            className="w-full bg-gray-950/60 border border-gray-800 rounded-lg p-3 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-purple-500 resize-none"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[
              '🍝 Plat signature',
              '🌅 Ambiance du soir',
              '🥖 Petit-déjeuner',
              '🎉 Événement à venir',
              '🍷 Nouvelle carte',
            ].map(p => (
              <button
                key={p}
                onClick={() => setBrief(b => b + (b ? '\n' : '') + p)}
                type="button"
                className="text-xs px-2.5 py-1.5 min-h-[36px] rounded-md bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700"
              >
                {p}
              </button>
            ))}
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
                  className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 ${
                    active
                      ? cfg.color
                      : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300'
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
          <label className="text-sm font-semibold text-white mb-3 block">📦 Type de contenu</label>
          <div className="grid grid-cols-3 gap-2">
            {(['photo', 'reel', 'story'] as ContentType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setContentType(t)}
                className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  contentType === t
                    ? 'bg-purple-600/20 border-purple-600/40 text-purple-300'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
                }`}
              >
                {t === 'photo' && '📸 Photo'}
                {t === 'reel' && '🎬 Reel'}
                {t === 'story' && '📖 Story'}
              </button>
            ))}
          </div>
        </div>

        {/* Image mode */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
          <label className="text-sm font-semibold text-white mb-3 block">🖼️ Visuel du post</label>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setImageMode('generate')
                setSelectedAsset(null)
              }}
              className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 ${
                imageMode === 'generate'
                  ? 'bg-purple-600/20 border-purple-600/40 text-purple-300'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200'
              }`}
            >
              <Wand2 className="w-4 h-4" />
              Générer une image
            </button>
            <button
              type="button"
              onClick={() => {
                setImageMode('library')
                setSelectedAsset(null)
                setAssetsLoading(true)
              }}
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

          {imageMode === 'library' && (
            <div>
              {assetsLoading && (
                <div className="flex items-center justify-center py-6 text-gray-500 text-sm gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
                </div>
              )}
              {!assetsLoading && clientAssets.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">
                  Aucune image dans la bibliothèque de ce client.{' '}
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
                      className={`relative rounded-lg overflow-hidden aspect-square border-2 transition-all ${
                        selectedAsset?.id === asset.id
                          ? 'border-blue-500 ring-2 ring-blue-500/30'
                          : 'border-transparent hover:border-gray-600'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.thumbnailUrl ?? asset.url}
                        alt={asset.originalName}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
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
                <p className="text-xs text-blue-400 mt-2 truncate">
                  ✓ Sélectionné : {selectedAsset.originalName}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!clientId || platforms.length === 0 || isPending || (imageMode === 'library' && !selectedAsset)}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Création du post complet...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Générer post complet
            </>
          )}
        </button>

        <div className="text-center text-[11px] text-gray-500">
          Powered by <span className="text-purple-400">Social Expert</span> · Claude Sonnet 4.6
        </div>
      </div>

      {/* RIGHT: Result */}
      <div className="col-span-1 lg:col-span-7">
        {!result && !error && !isPending && (
          <div className="bg-gray-900/20 border border-dashed border-gray-700 rounded-2xl p-12 text-center">
            <Sparkles className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">
              Configurez votre brief puis cliquez sur <strong>Générer</strong>.
            </p>
            <p className="text-xs text-gray-600 mt-2">
              L&apos;agent Social Expert va analyser le contexte client et créer du contenu optimisé.
            </p>
          </div>
        )}

        {isPending && (
          <div className="bg-gradient-to-br from-purple-950/40 to-pink-950/30 border border-purple-700/30 rounded-2xl p-12 text-center">
            <Loader2 className="w-12 h-12 text-purple-400 mx-auto mb-3 animate-spin" />
            <p className="text-white font-medium">L&apos;agent réfléchit...</p>
            <div className="mt-4 space-y-1 text-xs text-gray-400">
              <p>→ Chargement du contexte client</p>
              <p>→ Application de la voix de marque et de la DA</p>
              <p>→ Génération texte + image</p>
              <p>→ Scoring d&apos;impact</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-950/30 border border-red-700/40 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-300">Erreur de génération</h3>
                <p className="text-sm text-red-400 mt-1">{error}</p>
                {error.includes('ANTHROPIC_API_KEY') && (
                  <p className="text-xs text-gray-400 mt-3">
                    💡 Ajoute ta clé Anthropic dans le fichier <code className="bg-gray-800 px-1 rounded">.env.local</code> ou via la page{' '}
                    <a href="/social/settings/connections" className="text-purple-400 hover:underline">Connexions</a>.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Generated post visual */}
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-emerald-400">Post complet généré</div>
                  <div className="text-sm text-gray-400">Draft #{result.post.id}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-300">{result.post.impactScore}/100</div>
                  <div className="text-[11px] text-gray-500">score impact</div>
                </div>
              </div>

              {result.post.imageUrl && (
                <div className="bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.post.imageUrl}
                    alt="Visuel généré"
                    loading="lazy"
                    decoding="async"
                    className="w-full max-h-[520px] object-contain"
                  />
                </div>
              )}

              <div className="p-4 border-t border-gray-800 text-sm text-gray-300">
                <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">Analyse impact</div>
                {result.post.impactAnalysis}
              </div>
            </div>

            {/* Reasoning */}
            <div className="bg-purple-950/20 border border-purple-700/30 rounded-2xl p-4">
              <div className="text-[11px] uppercase tracking-wider text-purple-400 mb-1">💡 Stratégie</div>
              <p className="text-sm text-gray-300">{result.reasoning}</p>
            </div>

            {result.directive && (
              <div className="bg-amber-950/20 border border-amber-700/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-amber-400">
                  <Target className="w-4 h-4" />
                  <span>Account Director — Pilier prioritaire : {result.directive.priorityPillar}</span>
                </div>
                <div className="space-y-2 text-sm text-gray-300">
                  <p><span className="text-amber-300">Rationale :</span> {result.directive.rationale}</p>
                  <p><span className="text-amber-300">Hook proposé :</span> &ldquo;{result.directive.hookSuggestion}&rdquo;</p>
                  <p><span className="text-amber-300">CTA proposé :</span> {result.directive.ctaSuggestion}</p>
                </div>
                {result.directive.recentPillarsCovered.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {result.directive.recentPillarsCovered.map(pillar => (
                      <span
                        key={pillar}
                        className="text-[11px] px-2 py-1 rounded-md bg-amber-900/30 border border-amber-700/30 text-amber-200"
                      >
                        {pillar}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Captions per platform */}
            {result.captions.map((c, i) => (
              <CaptionResult key={i} caption={c} clientEmoji={selectedClient?.emoji || '🏢'} clientName={selectedClient?.name || ''} />
            ))}

            {/* Cost footer */}
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Tokens utilisés : <span className="text-purple-400">{result.tokensUsed.toLocaleString()}</span></span>
                <span>Coût estimé : <span className="text-purple-400">${result.cost.toFixed(4)}</span></span>
                <span>Status : <span className="text-emerald-400">{result.post.status}</span></span>
              </div>

              {clientId && (
                <div className="flex justify-end">
                  <a
                    href={`/clients/${clientId}/connections`}
                    className="text-[11px] text-blue-300 hover:underline"
                  >
                    🩺 Vérifier le token Meta du client
                  </a>
                </div>
              )}

              <PostSupervisor post={result.post} />

              <PostActions post={result.post} refresh={false} />

              <div className="flex items-center justify-end pt-2 border-t border-gray-800">
                <button
                  onClick={handleGenerate}
                  disabled={isPending}
                  className="flex items-center gap-1 text-purple-400 hover:underline text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Régénérer le post
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function createLoadedPostResult(post: Post): GenerationResult {
  return {
    post,
    reasoning: post.reasoning ?? 'Draft existant chargé depuis la file de validation.',
    captions: post.platforms
      .filter((platform): platform is Platform => ['instagram', 'facebook', 'tiktok', 'linkedin'].includes(platform))
      .map(platform => ({
        platform,
        caption: post.caption,
        hashtags: post.hashtags,
        hook: post.hook ?? '',
        cta: post.cta ?? '',
        characterCount: post.caption.length,
      })),
    cost: post.cost,
    tokensUsed: post.tokensUsed,
    model: 'draft-existant',
    review: post.supervisorReview ?? undefined,
  }
}

// ─── Caption Result Component ─────────────────────────────────────────────────

function CaptionResult({ caption, clientEmoji, clientName }: { caption: GeneratedCaption; clientEmoji: string; clientName: string }) {
  const [copied, setCopied] = useState(false)
  const cfg = PLATFORM_INFO[caption.platform]

  const handleCopy = () => {
    const fullText = caption.caption + '\n\n' + caption.hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')
    navigator.clipboard.writeText(fullText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-3 border-b border-gray-800 flex items-center justify-between ${cfg.color.replace('text-', 'bg-').replace('/20', '/10')}`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{cfg.emoji}</span>
          <span className="text-sm font-semibold text-white">{cfg.label}</span>
          <span className="text-[11px] text-gray-500">· {caption.characterCount} caractères</span>
        </div>
        <button
          onClick={handleCopy}
          className="text-xs px-2.5 py-1 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 flex items-center gap-1"
        >
          {copied ? <><Check className="w-3 h-3 text-green-400" /> Copié</> : <><Copy className="w-3 h-3" /> Copier</>}
        </button>
      </div>

      {/* IG-like preview if Instagram */}
      {caption.platform === 'instagram' ? (
        <div className="bg-white">
          {/* IG header */}
          <div className="flex items-center gap-3 p-3 border-b border-gray-200">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-600 to-red-700 flex items-center justify-center text-base">
              {clientEmoji}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">{clientName.toLowerCase().replace(/\s+/g, '')}</div>
            </div>
          </div>
          {/* Placeholder image */}
          <div className="aspect-square bg-gradient-to-br from-purple-100 via-pink-100 to-amber-100 flex items-center justify-center text-6xl">
            {clientEmoji}
          </div>
          {/* Actions */}
          <div className="p-3 text-gray-900">
            <div className="flex items-center gap-4 mb-2">
              <Heart className="w-6 h-6" />
              <MessageCircle className="w-6 h-6" />
              <Send className="w-6 h-6" />
              <Bookmark className="w-6 h-6 ml-auto" />
            </div>
            <div className="text-sm">
              <span className="font-semibold mr-1.5">{clientName.toLowerCase().replace(/\s+/g, '')}</span>
              {caption.caption}
              <div className="text-blue-700 mt-2">
                {caption.hashtags.map((h, i) => (
                  <span key={i} className="mr-1.5">#{h.replace(/^#/, '')}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 space-y-3">
          <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{caption.caption}</div>
          {caption.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {caption.hashtags.map((h, i) => (
                <span key={i} className="text-xs text-blue-400">#{h.replace(/^#/, '')}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Insights */}
      <div className="px-5 py-3 border-t border-gray-800 bg-gray-950/40 grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-gray-500">Hook :</span>{' '}
          <span className="text-purple-300 italic">&ldquo;{caption.hook}&rdquo;</span>
        </div>
        <div>
          <span className="text-gray-500">CTA :</span>{' '}
          <span className="text-emerald-300">{caption.cta}</span>
        </div>
      </div>
    </div>
  )
}
