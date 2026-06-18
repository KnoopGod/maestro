import Link from 'next/link'
import { Plus } from 'lucide-react'
import { listClientsWithStats } from '@/lib/db/queries/clients'
import { ClientGridWithFilters } from '@/components/clients/ClientFilters'
import { CLIENT_TYPES, CLIENT_STATUS, type ClientType, type ClientStatus } from '@/types/client'

export const dynamic = 'force-dynamic'

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string }>
}) {
  const { type, status } = await searchParams
  const filter = isClientType(type) ? type : 'all'
  const statusFilter = isClientStatus(status) ? status : 'all'
  const clients = await listClientsWithStats()

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {clients.length === 0
              ? 'Aucun client enregistré'
              : `${clients.length} client${clients.length > 1 ? 's' : ''} HORECA`}
          </p>
        </div>

        <Link
          href="/clients/new"
          title="Créer un nouveau profil client avec sa stratégie, sa DA et ses connexions"
          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau client
        </Link>
      </div>

      <ClientGridWithFilters clients={clients} filter={filter} statusFilter={statusFilter} />
    </div>
  )
}

function isClientType(value: string | undefined): value is ClientType {
  return !!value && value in CLIENT_TYPES
}

function isClientStatus(value: string | undefined): value is ClientStatus {
  return !!value && value in CLIENT_STATUS
}
