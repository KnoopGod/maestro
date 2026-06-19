import Link from 'next/link'
import { listClients } from '@/lib/db/queries/clients'
import { getPost } from '@/lib/db/queries/posts'
import { getVisualIdentity } from '@/lib/db/queries/assets'
import { StudioForm } from '@/components/studio/StudioForm'

export const dynamic = 'force-dynamic'

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; postId?: string; pillar?: string; objective?: string }>
}) {
  const { client: initialClientId, postId, pillar, objective: initialObjective } = await searchParams
  const [clients, initialPost] = await Promise.all([
    listClients(),
    postId ? getPost(postId) : Promise.resolve(null),
  ])
  const identities = await Promise.all(clients.map(async client => [client.id, await getVisualIdentity(client.id)] as const))
  const clientDaStatus = Object.fromEntries(identities.map(([id, identity]) => [
    id,
    {
      active: Boolean(identity?.stylePrompt || identity?.visualSummary),
      summary: identity?.visualSummary ?? undefined,
    },
  ]))

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
      </div>

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
        initialClientId={initialPost?.clientId ?? initialClientId}
        initialPost={initialPost ?? undefined}
        initialPillar={pillar}
        initialObjective={initialObjective}
        clientDaStatus={clientDaStatus}
      />
    </div>
  )
}
