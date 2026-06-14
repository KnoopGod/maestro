'use client'
import { useEffect, useState } from 'react'
import type { ContentType } from '@/lib/studio/types'
import { CONTENT_TYPE_INFO } from '@/lib/studio/types'

interface Capabilities {
  lumaEnabled: boolean
  imageModel: string
}

interface Props {
  contentType: ContentType
  onSelect: (type: ContentType) => void
}

export function ContentTypeCard({ contentType, onSelect }: Props) {
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null)

  useEffect(() => {
    fetch('/api/studio/capabilities')
      .then(r => r.json())
      .then((data: Capabilities) => setCapabilities(data))
      .catch(() => { /* silencieux — UI dégradée acceptée */ })
  }, [])

  const reelNote = capabilities === null
    ? CONTENT_TYPE_INFO.reel.note
    : capabilities.lumaEnabled
      ? 'Vidéo IA via Luma Dream Machine · aspect 9:16'
      : 'Sélectionner une vidéo depuis la Library (LUMA_API_KEY requis pour la génération IA)'

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
      <label className="text-sm font-semibold text-white mb-3 block">📦 Format Instagram</label>
      <div className="grid grid-cols-3 gap-2">
        {(['photo', 'story', 'reel'] as ContentType[]).map(t => {
          const info = CONTENT_TYPE_INFO[t]
          return (
            <button
              key={t}
              type="button"
              onClick={() => onSelect(t)}
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
      <p className="mt-2 text-[11px] text-gray-500">
        {contentType === 'reel' ? reelNote : CONTENT_TYPE_INFO[contentType].note}
      </p>
    </div>
  )
}
