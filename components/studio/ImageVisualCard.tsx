'use client'
import { ImageIcon, Wand2, Loader2, Film, Check } from 'lucide-react'
import type { ClientAsset } from '@/types/asset'
import type { ContentType } from '@/lib/studio/types'

interface Props {
  imageMode: 'generate' | 'library'
  contentType: ContentType
  visualPrompt: string
  assetsLoading: boolean
  clientAssets: ClientAsset[]
  selectedAsset: ClientAsset | null
  clientId: string
  onSwitchToGenerate: () => void
  onSwitchToLibrary: () => void
  onAssetToggle: (asset: ClientAsset) => void
  onVisualPromptChange: (v: string) => void
}

export function ImageVisualCard({
  imageMode, contentType, visualPrompt, assetsLoading, clientAssets,
  selectedAsset, clientId, onSwitchToGenerate, onSwitchToLibrary, onAssetToggle, onVisualPromptChange,
}: Props) {
  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
      <label className="text-sm font-semibold text-white mb-3 block">🖼️ Visuel du post</label>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          type="button"
          disabled={contentType === 'reel'}
          onClick={onSwitchToGenerate}
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
          onClick={onSwitchToLibrary}
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
            onChange={e => onVisualPromptChange(e.target.value)}
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
                  onClick={() => onAssetToggle(asset)}
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
  )
}
