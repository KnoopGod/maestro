'use client'
import { useState, useTransition } from 'react'
import { Sparkles, Loader2, AlertCircle, RefreshCw, Copy, Check, Heart, MessageCircle, Send, Bookmark, UploadCloud } from 'lucide-react'
import type { Client } from '@/types/client'
import type { Post } from '@/types/post'

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
}

const PLATFORM_INFO: Record<Platform, { label: string; emoji: string; color: string }> = {
  instagram: { label: 'Instagram', emoji: '📷', color: 'bg-pink-600/20 border-pink-600/40 text-pink-300' },
  facebook:  { label: 'Facebook',  emoji: '👍', color: 'bg-blue-600/20 border-blue-600/40 text-blue-300' },
  tiktok:    { label: 'TikTok',    emoji: '🎵', color: 'bg-purple-600/20 border-purple-600/40 text-purple-300' },
  linkedin:  { label: 'LinkedIn',  emoji: '💼', color: 'bg-sky-600/20 border-sky-600/40 text-sky-300' },
}

export function StudioForm({ clients, initialClientId }: { clients: Client[]; initialClientId?: string }) {
  const [clientId, setClientId] = useState(initialClientId || clients[0]?.id || '')
  const [brief, setBrief] = useState('')
  const [platforms, setPlatforms] = useState<Platform[]>(['instagram'])
  const [contentType, setContentType] = useState<ContentType>('photo')

  const [result, setResult] = useState<GenerationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isPending, startTransition] = useTransition()

  const selectedClient = clients.find(c => c.id === clientId)

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
          body: JSON.stringify({ clientId, brief, platforms, contentType }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur génération')
        setResult(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      }
    })
  }

  const handlePublish = async (forceTextOnly = false) => {
    if (!result?.post) return
    setPublishError(null)
    setPublishSuccess(null)
    setIsPublishing(true)

    try {
      const res = await fetch('/api/studio/publish-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: result.post.id, forceTextOnly }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur publication')
      setResult(prev => prev ? { ...prev, post: data.post } : prev)

      let msg = 'Post publié avec succès sur les plateformes connectées.'
      if (data.warnings?.length) {
        msg += ' ⚠️ ' + data.warnings.join(' ')
      }
      setPublishSuccess(msg)
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* LEFT: Inputs */}
      <div className="col-span-5 space-y-4">
        {/* Client selector */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
          <label className="text-sm font-semibold text-white mb-3 block">👤 Client</label>
          <select
            value={clientId}
            onChange={e => setClientId(e.target.value)}
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
        </div>

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
                className="text-[11px] px-2 py-1 rounded-md bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700"
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

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!clientId || !brief || platforms.length === 0 || isPending}
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
      <div className="col-span-7">
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

              {publishError && (
                <div className="rounded-lg border border-red-700/40 bg-red-950/30 p-3 space-y-2">
                  <div className="flex items-start gap-2 text-xs text-red-200">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="whitespace-pre-wrap">{publishError}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-red-800/40">
                    {clientId && (
                      <a
                        href={`/clients/${clientId}/connections`}
                        className="text-[11px] px-2 py-1 rounded border border-blue-700/40 text-blue-300 hover:bg-blue-900/30"
                      >
                        🩺 Diagnostiquer le token
                      </a>
                    )}
                    <button
                      onClick={() => handlePublish(true)}
                      className="text-[11px] px-2 py-1 rounded border border-amber-700/40 text-amber-300 hover:bg-amber-900/30"
                    >
                      ✉️ Réessayer sans image (texte seul)
                    </button>
                  </div>
                </div>
              )}

              {publishSuccess && (
                <div className="rounded-lg border border-emerald-700/40 bg-emerald-950/30 p-3 text-xs text-emerald-200">
                  {publishSuccess}
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={() => handlePublish(false)}
                  disabled={isPublishing || result.post.status === 'published'}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  {result.post.status === 'published' ? 'Déjà publié' : 'Publier sur Meta'}
                </button>

              <button
                onClick={handleGenerate}
                disabled={isPending}
                className="flex items-center gap-1 text-purple-400 hover:underline"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Régénérer
              </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
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
