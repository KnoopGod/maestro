import Link from 'next/link'
import { Layers, ArrowLeft, Sparkles } from 'lucide-react'
import { listClients } from '@/lib/db/queries/clients'
import { BatchStudioForm } from '@/components/studio/BatchStudioForm'
import { EmptyState } from '@/components/ui/EmptyState'

export const dynamic = 'force-dynamic'

export default async function BatchStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>
}) {
  const { client: initialClientId } = await searchParams
  const clients = await listClients()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/studio" className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Studio
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Layers className="w-7 h-7 text-purple-400" />
            Génération en lot
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Génère 3, 5 ou 7 posts sur des piliers variés en une seule action
          </p>
        </div>
      </div>

      <div className="bg-purple-950/20 border border-purple-700/30 rounded-2xl p-4 text-sm text-purple-200 space-y-1.5">
        <p className="font-semibold text-white">Comment ça fonctionne ?</p>
        <ol className="list-decimal list-inside space-y-1 text-purple-300">
          <li>L&apos;agent <strong>Planner</strong> génère N idées sur des piliers différents selon la stratégie du client</li>
          <li>N pipelines complets sont lancés en parallèle (Account Director → Social Expert → Visual → Supervisor)</li>
          <li>Les posts apparaissent en <strong>Validation</strong> dès qu&apos;ils sont prêts</li>
        </ol>
        <p className="text-[11px] text-purple-400 pt-1">
          Durée estimée : 2–5 min pour 5 posts avec images · 30–60s en mode texte seul
        </p>
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="Aucun client"
          description="Crée un client avant de générer un lot de posts."
          cta={{ label: 'Créer un client', href: '/clients/new', icon: Sparkles }}
        />
      ) : (
        <BatchStudioForm clients={clients} initialClientId={initialClientId} />
      )}
    </div>
  )
}
