import Link from 'next/link'
import { Plus } from 'lucide-react'
import { listClientsWithStats } from '@/lib/db/queries/clients'
import { ClientGridWithFilters } from '@/components/clients/ClientFilters'

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const clients = await listClientsWithStats()

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {clients.length} {clients.length > 1 ? 'clients HORECA actifs' : 'client HORECA actif'}
          </p>
        </div>

        <Link
          href="/clients/new"
          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau client
        </Link>
      </div>

      <ClientGridWithFilters clients={clients} />
    </div>
  )
}
