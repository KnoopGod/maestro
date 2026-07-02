import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { listClients } from '@/lib/db/queries/clients'
import { CampaignForm } from '@/components/campaigns/CampaignForm'

export const dynamic = 'force-dynamic'

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>
}) {
  const { client: initialClientId } = await searchParams
  const clients = await listClients()
  const activeClients = clients.filter(c => c.status === 'active')

  if (activeClients.length === 0) {
    return (
      <div className="max-w-2xl text-center py-12">
        <div className="text-5xl mb-4">📣</div>
        <h1 className="text-2xl font-bold text-white">Nouvelle campagne</h1>
        <p className="text-gray-400 mt-2">
          Aucun client actif. Créez d&apos;abord un client pour lancer une campagne.
        </p>
        <Link
          href="/clients/new"
          className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 active:scale-[0.98] text-white text-sm font-medium transition-all duration-150"
        >
          + Créer un client
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/campaigns"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-150" />
        Retour aux campagnes
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-white">Nouvelle campagne</h1>
        <p className="text-sm text-gray-400 mt-1">
          Le Media Planner génère le ciblage, la répartition du budget et les annonces prêtes à copier dans la régie.
        </p>
      </div>

      <CampaignForm clients={activeClients} initialClientId={initialClientId} />
    </div>
  )
}
