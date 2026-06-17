import Link from 'next/link'
import type { PillarCount } from '@/lib/db/queries/posts'

interface Props {
  clientId: string
  pillars: string[]
  distribution: PillarCount[]
}

export function PillarCoverageWidget({ clientId, pillars, distribution }: Props) {
  if (pillars.length === 0) return null

  const distMap = new Map<string, number>(distribution.map(d => [d.pillar, d.count]))
  const maxCount = Math.max(...distribution.map(d => d.count), 1)

  const items = pillars.map(pillar => ({
    pillar,
    count: distMap.get(pillar) ?? 0,
  }))

  const uncovered = items.filter(i => i.count === 0)

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-white">Couverture des piliers</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Posts des 30 derniers jours</div>
        </div>
        {uncovered.length > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/30 border border-amber-700/40 text-amber-300">
            {uncovered.length} négligé{uncovered.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="space-y-2.5">
        {items.map(({ pillar, count }) => {
          const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0
          const isEmpty = count === 0
          return (
            <Link
              key={pillar}
              href={`/studio?client=${clientId}&pillar=${encodeURIComponent(pillar)}`}
              title={`Créer un post pour le pilier : ${pillar}`}
              className="group block"
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs truncate ${isEmpty ? 'text-amber-300' : 'text-gray-300'}`}>
                  {isEmpty && <span className="mr-1">⚠</span>}
                  {pillar}
                </span>
                <span className={`text-[10px] font-mono ml-2 flex-shrink-0 ${isEmpty ? 'text-amber-400' : 'text-gray-500'}`}>
                  {count} post{count !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                {isEmpty ? (
                  <div className="h-full w-0" />
                ) : (
                  <div
                    className="h-full bg-purple-500 group-hover:bg-purple-400 transition-all rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                )}
              </div>
            </Link>
          )
        })}
      </div>
      {uncovered.length > 0 && (
        <p className="text-[11px] text-amber-300/70 mt-3">
          Clique sur un pilier pour créer un post et rééquilibrer ta stratégie.
        </p>
      )}
    </div>
  )
}
