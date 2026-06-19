import Link from 'next/link'
import { Plus } from 'lucide-react'
import { listClientsWithStats } from '@/lib/db/queries/clients'
import { ClientGridWithFilters } from '@/components/clients/ClientFilters'
import { CLIENT_TYPES, type ClientType } from '@/types/client'

export const dynamic = 'force-dynamic'

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const { type } = await searchParams
  const filter = isClientType(type) ? type : 'all'
  const clients = await listClientsWithStats()

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Clients</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {clients.length === 0
              ? 'Aucun client enregistré'
              : `${clients.length} client${clients.length > 1 ? 's' : ''} HORECA`}
          </p>
        </div>

        <Link
          href="/clients/new"
          title="Créer un nouveau profil client avec sa stratégie, sa DA et ses connexions"
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 active:scale-[0.98] text-white text-sm font-medium transition-all duration-150 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau client
        </Link>
      </div>

      <ClientGridWithFilters clients={clients} filter={filter} />
    </div>
  )
}

function isClientType(value: string | undefined): value is ClientType {
  return !!value && value in CLIENT_TYPES
}
