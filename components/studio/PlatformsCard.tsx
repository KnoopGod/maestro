'use client'
import type { Platform } from '@/lib/studio/types'
import { PLATFORM_INFO } from '@/lib/studio/types'

interface Props {
  platforms: Platform[]
  onToggle: (p: Platform) => void
}

export function PlatformsCard({ platforms, onToggle }: Props) {
  return (
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
              onClick={() => onToggle(p)}
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
  )
}
