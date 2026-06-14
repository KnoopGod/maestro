'use client'
import { useState, useTransition, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Star, Trash2, FileText, Film, Eye, Loader2, Clapperboard, CheckCircle2, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatFileSize, ASSET_CATEGORIES, type ClientAsset } from '@/types/asset'

type AnimateStatus = 'idle' | 'starting' | 'pending' | 'dreaming' | 'saving' | 'done' | 'error'

export function AssetCard({ asset }: { asset: ClientAsset }) {
  const [isPending, startTransition] = useTransition()
  const [showPreview, setShowPreview] = useState(false)
  const router = useRouter()

  // ── Animate state ───────────────────────────────────────────────────────────
  const [animateStatus, setAnimateStatus] = useState<AnimateStatus>('idle')
  const [animateError, setAnimateError] = useState('')
  const generationIdRef = useRef<string | null>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cancelledRef = useRef(false)

  useEffect(() => () => {
    cancelledRef.current = true
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
  }, [])

  const canAnimate = asset.type === 'image' || asset.type === 'logo'
  const isAnimating = animateStatus === 'starting' || animateStatus === 'pending' || animateStatus === 'dreaming' || animateStatus === 'saving'

  async function handleAnimate(e: React.MouseEvent) {
    e.stopPropagation()
    if (isAnimating || animateStatus === 'done') return
    cancelledRef.current = false
    setAnimateStatus('starting')
    setAnimateError('')

    try {
      const res = await fetch(`/api/clients/${asset.clientId}/assets/${asset.id}/animate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: asset.aiDescription }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur démarrage')

      generationIdRef.current = data.generationId
      setAnimateStatus(data.status === 'dreaming' ? 'dreaming' : 'pending')
      startPolling(data.generationId)
    } catch (err) {
      if (!cancelledRef.current) {
        setAnimateStatus('error')
        setAnimateError(err instanceof Error ? err.message : 'Erreur inconnue')
      }
    }
  }

  function startPolling(generationId: string) {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)

    pollIntervalRef.current = setInterval(async () => {
      if (cancelledRef.current) {
        clearInterval(pollIntervalRef.current!)
        return
      }
      try {
        const res = await fetch(
          `/api/clients/${asset.clientId}/assets/${asset.id}/animate?generationId=${generationId}`
        )
        const data = await res.json()

        if (cancelledRef.current) return

        if (data.status === 'completed') {
          clearInterval(pollIntervalRef.current!)
          setAnimateStatus('saving')
          // Saving already happened server-side; refresh to show new video
          setTimeout(() => {
            if (!cancelledRef.current) {
              setAnimateStatus('done')
              router.refresh()
            }
          }, 800)
        } else if (data.status === 'failed') {
          clearInterval(pollIntervalRef.current!)
          setAnimateStatus('error')
          setAnimateError(data.error || 'Génération échouée')
        } else {
          setAnimateStatus(data.status === 'dreaming' ? 'dreaming' : 'pending')
        }
      } catch {
        // transient error — keep polling
      }
    }, 4000)
  }

  const handleDelete = () => {
    if (!confirm(`Supprimer "${asset.originalName}" ?`)) return
    startTransition(async () => {
      await fetch(`/api/clients/${asset.clientId}/assets/${asset.id}`, { method: 'DELETE' })
      router.refresh()
    })
  }

  const toggleStar = () => {
    startTransition(async () => {
      await fetch(`/api/clients/${asset.clientId}/assets/${asset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ starred: !asset.starred }),
      })
      router.refresh()
    })
  }

  const categoryCfg = asset.category ? ASSET_CATEGORIES[asset.category] : null

  const ANIMATE_LABEL: Record<AnimateStatus, string> = {
    idle: 'Animer en Reel',
    starting: 'Démarrage...',
    pending: 'En file...',
    dreaming: 'Génération...',
    saving: 'Sauvegarde...',
    done: 'Reel créé ✓',
    error: 'Réessayer',
  }

  return (
    <>
      <div className="group relative bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden hover:border-purple-700/50 transition-all">
        {/* Visual */}
        <div
          className="aspect-square relative cursor-pointer"
          onClick={() => setShowPreview(true)}
          title={`Prévisualiser ${asset.originalName}`}
        >
          {asset.type === 'image' || asset.type === 'logo' ? (
            <Image src={asset.thumbnailUrl ?? asset.url} alt={asset.originalName} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
          ) : asset.type === 'video' ? (
            <div className="w-full h-full bg-gradient-to-br from-amber-900 to-orange-950 flex items-center justify-center relative">
              <Film className="w-12 h-12 text-amber-300/60" />
              <video src={asset.url} preload="metadata" className="absolute inset-0 w-full h-full object-cover opacity-40" />
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-900 to-indigo-950 flex flex-col items-center justify-center p-4">
              <FileText className="w-12 h-12 text-blue-300/80 mb-2" />
              <span className="text-[10px] text-blue-300 uppercase tracking-wider">
                {asset.mimeType.split('/').pop()}
              </span>
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Eye className="w-8 h-8 text-white" />
          </div>

          {/* Top right actions */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={e => { e.stopPropagation(); toggleStar() }} title={asset.starred ? 'Retirer cette ressource des favoris DA' : 'Marquer cette ressource comme référence importante de la DA'} className="p-1.5 rounded-lg bg-black/60 backdrop-blur hover:bg-black/80">
              <Star className={`w-3.5 h-3.5 ${asset.starred ? 'text-yellow-400 fill-yellow-400' : 'text-white'}`} />
            </button>
            <button onClick={e => { e.stopPropagation(); handleDelete() }} disabled={isPending} title={`Supprimer ${asset.originalName} de la Library`} className="p-1.5 rounded-lg bg-black/60 backdrop-blur hover:bg-red-600">
              {isPending ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Trash2 className="w-3.5 h-3.5 text-white" />}
            </button>
          </div>

          {/* Top left badge */}
          {categoryCfg && (
            <div className="absolute top-2 left-2 text-[10px] bg-black/60 backdrop-blur px-1.5 py-0.5 rounded text-white">
              {categoryCfg.emoji} {categoryCfg.label}
            </div>
          )}

          {asset.starred && (
            <div className="absolute top-2 right-2 group-hover:hidden">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 drop-shadow" />
            </div>
          )}

          {asset.analyzedAt && (
            <div className="absolute bottom-2 right-2 text-[9px] bg-emerald-500/80 backdrop-blur px-1.5 py-0.5 rounded text-white">
              ✨ Analysé
            </div>
          )}

          {/* Animate overlay while generating */}
          {isAnimating && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
              <span className="text-xs text-orange-300 font-medium">{ANIMATE_LABEL[animateStatus]}</span>
            </div>
          )}
        </div>

        {/* Info + Animate button */}
        <div className="p-3 space-y-2">
          <div>
            <div className="text-xs text-gray-300 truncate">{asset.originalName}</div>
            <div className="text-[10px] text-gray-600 mt-0.5">{formatFileSize(asset.sizeBytes)}</div>
          </div>

          {canAnimate && animateStatus !== 'done' && (
            <button
              onClick={handleAnimate}
              disabled={isAnimating}
              title="Créer un Reel court à partir de cette image avec l'IA vidéo"
              className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                animateStatus === 'error'
                  ? 'bg-red-900/30 border border-red-700/40 text-red-300 hover:bg-red-900/50'
                  : 'bg-orange-900/20 border border-orange-700/30 text-orange-300 hover:bg-orange-900/40'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isAnimating
                ? <><Loader2 className="w-3 h-3 animate-spin" /> {ANIMATE_LABEL[animateStatus]}</>
                : animateStatus === 'error'
                  ? <><XCircle className="w-3 h-3" /> {ANIMATE_LABEL[animateStatus]}</>
                  : <><Clapperboard className="w-3 h-3" /> Animer en Reel</>
              }
            </button>
          )}

          {animateStatus === 'done' && (
            <div className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Reel ajouté à la bibliothèque
            </div>
          )}

          {animateStatus === 'error' && animateError && (
            <div className="text-[10px] text-red-400 line-clamp-2">{animateError}</div>
          )}
        </div>
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-8" onClick={() => setShowPreview(false)}>
          <button onClick={() => setShowPreview(false)} title="Fermer la prévisualisation" className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white text-2xl">×</button>
          <div className="max-w-4xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            {asset.type === 'image' || asset.type === 'logo' ? (
              <div className="relative w-[80vw] max-w-3xl h-[80vh]">
                <Image src={asset.url} alt={asset.originalName} fill sizes="80vw" className="object-contain rounded-lg" />
              </div>
            ) : asset.type === 'video' ? (
              <video src={asset.url} controls autoPlay className="max-w-full max-h-[80vh] rounded-lg" />
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-8 h-8 text-blue-400" />
                  <div>
                    <div className="font-semibold text-white">{asset.originalName}</div>
                    <div className="text-xs text-gray-500">{formatFileSize(asset.sizeBytes)}</div>
                  </div>
                </div>
                {asset.extractedText && (
                  <div className="mt-4 max-h-96 overflow-y-auto p-4 bg-gray-950/60 border border-gray-800 rounded-lg">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Texte extrait</div>
                    <div className="text-sm text-gray-300 whitespace-pre-wrap">{asset.extractedText.slice(0, 3000)}</div>
                    {asset.extractedText.length > 3000 && <div className="text-xs text-gray-600 mt-2">... ({asset.extractedText.length - 3000} de plus)</div>}
                  </div>
                )}
                <a href={asset.url} target="_blank" rel="noopener noreferrer" title="Ouvrir ce document dans un nouvel onglet" className="inline-block mt-4 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm">
                  Ouvrir le document
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
