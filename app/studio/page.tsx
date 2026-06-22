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
  searchParams: Promise<{ client?: string; postId?: string; pillar?: string; cloneFrom?: string }>
}) {
  const { client: initialClientId, postId, pillar, cloneFrom } = await searchParams
  const [clients, initialPost, cloneFromPost] = await Promise.all([
    listClients(),
    postId ? getPost(postId) : Promise.resolve(null),
    cloneFrom ? getPost(cloneFrom) : Promise.resolve(null),
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

      {cloneFromPost && (
        <div className="bg-indigo-950/20 border border-indigo-700/30 rounded-2xl p-4 text-sm text-indigo-200 flex items-center gap-2">
          <span className="text-lg">📋</span>
          <div>
            <span className="font-semibold text-white">Mode template :</span>{' '}
            le brief du post <span className="text-indigo-300">#{cloneFromPost.id}</span> est pré-chargé.
            Modifie-le si besoin et clique <strong>Générer</strong> pour créer un nouveau post.
          </div>
        </div>
      )}

      <nav aria-label="Étapes de création d'un post" className="flex items-center gap-1.5 text-[11px] font-mono overflow-x-auto pb-0.5">
        {([
          ['/clients', 'Client'],
          [`/clients/${initialClientId ?? ''}/library`, 'Visuels'],
          ['/studio', 'Studio', true],
          ['/validation', 'Validation'],
          ['/calendar', 'Calendrier'],
        ] as [string, string, boolean?][]).map(([href, label, current], i) => (
          <span key={href} className="flex items-center gap-1.5 flex-shrink-0">
            {i > 0 && <span className="text-gray-700">›</span>}
            {current
              ? <span className="text-purple-400 font-semibold">{label}</span>
              : <a href={href} className="text-gray-600 hover:text-gray-400 transition-colors">{label}</a>
            }
          </span>
        ))}
      </nav>

      <StudioForm
        clients={clients}
        initialClientId={cloneFromPost?.clientId ?? initialPost?.clientId ?? initialClientId}
        initialPost={initialPost ?? undefined}
        cloneFromPost={cloneFromPost ?? undefined}
        initialPillar={cloneFromPost?.pillar ?? pillar ?? undefined}
        clientDaStatus={clientDaStatus}
      />
    </div>
  )
}
