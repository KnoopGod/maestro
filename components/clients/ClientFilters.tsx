'use client'
import { useState } from 'react'
import { CLIENT_TYPES, type ClientType, type ClientWithStats } from '@/types/client'
import { ClientCard } from './ClientCard'

type Filter = 'all' | ClientType

export function ClientGridWithFilters({ clients }: { clients: ClientWithStats[] }) {
  const [filter, setFilter] = useState<Filter>('all')

  const counts: Record<Filter, number> = {
    all: clients.length,
    restaurant: clients.filter(c => c.type === 'restaurant').length,
    hotel: clients.filter(c => c.type === 'hotel').length,
    bar: clients.filter(c => c.type === 'bar').length,
    bnb: clients.filter(c => c.type === 'bnb').length,
    restaurant_hotel: clients.filter(c => c.type === 'restaurant_hotel').length,
  }

  const filtered = filter === 'all'
    ? clients
    : clients.filter(c => c.type === filter)

  return (
    <>
      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`text-xs px-3 py-2 min-h-[36px] rounded-lg font-medium transition-all ${
            filter === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-900 border border-gray-800 text-gray-400 hover:bg-gray-800'
          }`}
        >
          Tous ({counts.all})
        </button>
        {(Object.keys(CLIENT_TYPES) as ClientType[]).filter(t => counts[t] > 0).map(t => {
          const cfg = CLIENT_TYPES[t]
          const active = filter === t
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                active
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-900 border border-gray-800 text-gray-400 hover:bg-gray-800'
              }`}
            >
              <span>{cfg.emoji}</span>
              {cfg.label} ({counts[t]})
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/20 border border-dashed border-gray-800 rounded-2xl">
          <p className="text-gray-500">Aucun client dans cette catégorie.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => <ClientCard key={c.id} client={c} />)}
        </div>
      )}
    </>
  )
}
