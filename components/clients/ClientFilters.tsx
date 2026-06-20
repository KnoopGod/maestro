import Link from 'next/link'
import { Plus, Building2 } from 'lucide-react'
import { CLIENT_TYPES, type ClientType, type ClientWithStats } from '@/types/client'
import { ClientCard } from './ClientCard'

type Filter = 'all' | ClientType

export function ClientGridWithFilters({
  clients,
  filter = 'all',
}: {
  clients: ClientWithStats[]
  filter?: Filter
}) {
  const counts: Record<Filter, number> = {
    all: clients.length,
    restaurant: clients.filter(c => c.type === 'restaurant').length,
    hotel: clients.filter(c => c.type === 'hotel').length,
    bar: clients.filter(c => c.type === 'bar').length,
    bnb: clients.filter(c => c.type === 'bnb').length,
    restaurant_hotel: clients.filter(c => c.type === 'restaurant_hotel').length,
  }

  const filtered = filter === 'all' ? clients : clients.filter(c => c.type === filter)

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-5 text-center">
        <Building2 className="w-10 h-10 text-gray-700 mx-auto" />
        <div>
          <p className="text-sm font-medium text-gray-400">Aucun client pour l&apos;instant</p>
          <p className="text-xs text-gray-600 mt-1 max-w-xs">
            Commencez par ajouter votre premier établissement HORECA pour générer du contenu avec
            les agents IA.
          </p>
        </div>
        <Link
          href="/clients/new"
          title="Créer le premier profil client HORECA"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 active:scale-[0.98] text-white text-sm font-medium rounded-xl transition-all duration-150"
        >
          <Plus className="w-4 h-4" />
          Créer mon premier client
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="flex gap-2 flex-wrap mb-6">
        <Link
          href="/clients"
          title="Afficher tous les clients sans filtre"
          className={`text-xs px-3 py-2 min-h-[36px] rounded-lg font-medium transition-all duration-150 active:scale-[0.98] ${
            filter === 'all'
              ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]'
              : 'bg-gray-900 border border-gray-800 text-gray-400 hover:bg-gray-800 hover:border-gray-700'
          }`}
        >
          Tous ({counts.all})
        </Link>
        {(Object.keys(CLIENT_TYPES) as ClientType[])
          .filter(t => counts[t] > 0)
          .map(t => {
            const cfg = CLIENT_TYPES[t]
            const active = filter === t
            return (
              <Link
                key={t}
                href={`/clients?type=${t}`}
                title={`Afficher uniquement les clients de type ${cfg.label}`}
                className={`text-xs px-3 py-2 min-h-[36px] rounded-lg font-medium transition-all duration-150 active:scale-[0.98] flex items-center gap-1.5 ${
                  active
                    ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                    : 'bg-gray-900 border border-gray-800 text-gray-400 hover:bg-gray-800 hover:border-gray-700'
                }`}
              >
                <span>{cfg.emoji}</span>
                {cfg.label} ({counts[t]})
              </Link>
            )
          })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/20 border border-dashed border-gray-800 rounded-2xl">
          <p className="text-sm text-gray-500">Aucun client dans cette catégorie.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <ClientCard key={c.id} client={c} />
          ))}
        </div>
      )}
    </>
  )
}
