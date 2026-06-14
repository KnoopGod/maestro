import Link from 'next/link'
import { Layers } from 'lucide-react'
import { listClients } from '@/lib/db/queries/clients'
import { getPost } from '@/lib/db/queries/posts'
import { getVisualIdentityBatch } from '@/lib/db/queries/assets'
import { StudioForm } from '@/components/studio/StudioForm'

export const dynamic = 'force-dynamic'

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; postId?: string; pillar?: string }>
}) {
  const { client: initialClientId, postId, pillar } = await searchParams
  const [clients, initialPost] = await Promise.all([
    listClients(),
    postId ? getPost(postId) : Promise.resolve(null),
  ])
  const identityMap = await getVisualIdentityBatch(clients.map(c => c.id))
  const clientDaStatus = Object.fromEntries(clients.map(c => {
    const identity = identityMap.get(c.id)
    return [c.id, {
      active: Boolean(identity?.stylePrompt || identity?.visualSummary),
      summary: identity?.visualSummary ?? undefined,
    }]
  }))

  if (clients.length === 0) {
    return (
      <div className="max-w-2xl text-center py-12">
        <div className="text-5xl mb-4">🎨</div>
        <h1 className="text-2xl font-bold text-white">Studio</h1>
        <p className="text-gray-400 mt-2">
          Tu n&apos;as pas encore de clients. Crée-en un d&apos;abord pour pouvoir générer du contenu.
        </p>
        <Link
          href="/clients/new"
          className="inline-block mt-6 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium"
        >
          + Créer un client
        </Link>
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
        <Link
          href="/studio/batch"
          title="Générer un lot de posts pour un client"
          className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium flex items-center gap-1.5 transition-colors"
        >
          <Layers className="w-4 h-4" />
          Générer en lot
        </Link>
      </div>

      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4">
        <div className="text-xs uppercase tracking-wider text-purple-400 mb-2">Tunnel MVP</div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs">
          {[
            ['1', 'Client', 'profil + stratégie'],
            ['2', 'Library', 'DA + ressources'],
            ['3', 'Studio', 'texte + image'],
            ['4', 'Validation', 'supervision + OK humain'],
            ['5', 'Calendrier', 'planifier ou publier'],
          ].map(([step, title, detail]) => (
            <div key={step} className="rounded-xl border border-gray-800 bg-gray-950/40 p-3">
              <div className="text-[10px] text-purple-400">ÉTAPE {step}</div>
              <div className="font-medium text-white mt-1">{title}</div>
              <div className="text-gray-500 mt-0.5">{detail}</div>
            </div>
          ))}
        </div>
      </div>

      <StudioForm
        clients={clients}
        initialClientId={initialPost?.clientId ?? initialClientId}
        initialPost={initialPost ?? undefined}
        initialPillar={pillar}
        clientDaStatus={clientDaStatus}
      />
    </div>
  )
}
