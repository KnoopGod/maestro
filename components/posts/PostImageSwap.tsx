'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ImageIcon, X, Check, Loader2, RefreshCw } from 'lucide-react'
import type { Post } from '@/types/post'
import type { ClientAsset } from '@/types/asset'

interface Props {
  post: Post
}

export function PostImageSwap({ post }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [images, setImages] = useState<ClientAsset[]>([])
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [selected, setSelected] = useState<ClientAsset | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // AI image regeneration
  const [showRegenPanel, setShowRegenPanel] = useState(false)
  const [regenPrompt, setRegenPrompt] = useState('')
  const [regenLoading, setRegenLoading] = useState(false)
  const [regenError, setRegenError] = useState<string | null>(null)

  async function regenImage() {
    setRegenLoading(true)
    setRegenError(null)
    try {
      const res = await fetch(`/api/posts/${post.id}/regenerate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visualPrompt: regenPrompt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur régénération image')
      setShowRegenPanel(false)
      setRegenPrompt('')
      router.refresh()
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setRegenLoading(false)
    }
  }

  async function openPicker() {
    setOpen(true)
    if (images.length > 0) return
    setLoadingAssets(true)
    const res = await fetch(`/api/clients/${post.clientId}/assets?type=image`).catch(() => null)
    if (res?.ok) {
      const d = await res.json().catch(() => ({ assets: [] }))
      setImages((d.assets as ClientAsset[] ?? []).filter((a: ClientAsset) => a.type === 'image' || a.type === 'logo'))
    }
    setLoadingAssets(false)
  }

  function apply() {
    if (!selected) return
    startTransition(async () => {
      setError(null)
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageAssetId: selected.id,
          imageUrl: selected.url,
          imagePrompt: selected.aiDescription ?? null,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError((d as { error?: string }).error ?? 'Erreur')
        return
      }
      setOpen(false)
      setSelected(null)
      router.refresh()
    })
  }

  function removeImage() {
    startTransition(async () => {
      setError(null)
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageAssetId: null, imageUrl: null, imagePrompt: null }),
      })
      if (res.ok) router.refresh()
    })
  }

  if (!open && !showRegenPanel) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={openPicker}
          title="Remplacer le visuel depuis la bibliothèque du client"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-700 text-gray-500 hover:text-purple-300 hover:border-purple-700/40 text-xs transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          Changer le visuel
        </button>
        {post.status !== 'published' && (
          <button
            type="button"
            onClick={() => setShowRegenPanel(true)}
            title="Régénérer l'image avec l'IA (coût ~$0.04)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-700 text-gray-500 hover:text-indigo-300 hover:border-indigo-700/40 text-xs transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Régénérer l&apos;image
          </button>
        )}
        {post.imageUrl && (
          <button
            type="button"
            onClick={removeImage}
            disabled={isPending}
            title="Retirer le visuel du post"
            className="text-xs text-gray-600 hover:text-red-400 transition-colors disabled:opacity-40"
          >
            {isPending ? <Loader2 className="w-3 h-3 animate-spin inline" /> : '✕ Retirer'}
          </button>
        )}
      </div>
    )
  }

  if (showRegenPanel) {
    return (
      <div className="space-y-3 border border-indigo-700/30 rounded-xl bg-indigo-950/10 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-indigo-300 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Régénérer l&apos;image IA
          </span>
          <button type="button" onClick={() => { setShowRegenPanel(false); setRegenError(null) }} className="text-gray-500 hover:text-gray-300">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">Direction visuelle personnalisée (optionnel)</label>
          <textarea
            value={regenPrompt}
            onChange={e => setRegenPrompt(e.target.value)}
            placeholder="Ex: photo d'assiette sur fond sombre, lumière chaude, vue de dessus"
            rows={2}
            className="w-full px-2.5 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-sm text-gray-200 placeholder-gray-600 focus:border-indigo-600 focus:outline-none resize-none"
          />
          <p className="text-[10px] text-gray-600 mt-1">Laisse vide pour utiliser le brief et la DA existants.</p>
        </div>
        {regenError && <p className="text-xs text-red-400">{regenError}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={regenImage}
            disabled={regenLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium transition-colors"
          >
            {regenLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {regenLoading ? 'Génération…' : 'Régénérer'}
          </button>
          <button
            type="button"
            onClick={() => { setShowRegenPanel(false); setRegenError(null) }}
            className="px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 text-xs hover:text-gray-200 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 border border-purple-700/30 rounded-xl bg-purple-950/10 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-purple-300">Choisir un visuel depuis la bibliothèque</span>
        <button type="button" onClick={() => { setOpen(false); setSelected(null) }} className="text-gray-500 hover:text-gray-300">
          <X className="w-4 h-4" />
        </button>
      </div>

      {loadingAssets ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-gray-500" /></div>
      ) : images.length === 0 ? (
        <p className="text-xs text-gray-500 italic">Aucune image disponible dans la bibliothèque.</p>
      ) : (
        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
          {images.map(asset => (
            <button
              key={asset.id}
              type="button"
              onClick={() => setSelected(prev => prev?.id === asset.id ? null : asset)}
              className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                selected?.id === asset.id
                  ? 'border-purple-500 ring-1 ring-purple-500/50'
                  : 'border-transparent hover:border-gray-600'
              }`}
              title={asset.originalName}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={asset.url} alt={asset.originalName} className="w-full aspect-square object-cover" />
              {selected?.id === asset.id && (
                <div className="absolute inset-0 bg-purple-900/40 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={apply}
          disabled={!selected || isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-medium transition-colors"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Appliquer
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setSelected(null) }}
          className="px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 text-xs hover:text-gray-200 transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}
