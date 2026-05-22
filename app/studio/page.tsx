import { listClients } from '@/lib/db/queries/clients'
import { StudioForm } from '@/components/studio/StudioForm'

export const dynamic = 'force-dynamic'

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>
}) {
  const { client: initialClientId } = await searchParams
  const clients = await listClients()

  if (clients.length === 0) {
    return (
      <div className="max-w-2xl text-center py-12">
        <div className="text-5xl mb-4">🎨</div>
        <h1 className="text-2xl font-bold text-white">Studio</h1>
        <p className="text-gray-400 mt-2">
          Tu n&apos;as pas encore de clients. Crée-en un d&apos;abord pour pouvoir générer du contenu.
        </p>
        <a
          href="/clients/new"
          className="inline-block mt-6 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium"
        >
          + Créer un client
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            🎨 Studio
            <span className="text-[10px] bg-pink-600/30 text-pink-300 border border-pink-700/40 rounded-full px-2 py-1">CŒUR CRÉATIF</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Génère des posts optimisés par plateforme avec l&apos;agent Social Expert
          </p>
        </div>
      </div>

      <StudioForm clients={clients} initialClientId={initialClientId} />
    </div>
  )
}
