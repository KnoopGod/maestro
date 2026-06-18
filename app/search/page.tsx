import Link from 'next/link'
import { Search, Users, FileText } from 'lucide-react'
import { searchClients } from '@/lib/db/queries/clients'
import { searchPosts } from '@/lib/db/queries/posts'
import { EmptyState } from '@/components/ui/EmptyState'
import { CLIENT_TYPES } from '@/types/client'

export const dynamic = 'force-dynamic'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = (q ?? '').trim()

  if (!query) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Search className="w-6 h-6 text-purple-400" />
          Recherche
        </h1>
        <p className="text-gray-500 text-sm">Saisis un terme dans la barre de recherche pour commencer.</p>
      </div>
    )
  }

  const [clients, posts] = await Promise.all([
    searchClients(query),
    searchPosts(query),
  ])

  const total = clients.length + posts.length

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Search className="w-6 h-6 text-purple-400" />
          Résultats pour «&nbsp;{query}&nbsp;»
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {total === 0 ? 'Aucun résultat' : `${total} résultat${total > 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Clients */}
      {clients.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Clients · {clients.length}
          </h2>
          <div className="space-y-2">
            {clients.map(c => (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-900/40 border border-gray-800 hover:border-purple-700/50 transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center text-lg flex-shrink-0`}>
                  {c.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{c.name}</div>
                  <div className="text-[11px] text-gray-500">
                    {CLIENT_TYPES[c.type]?.label}{c.city ? ` · ${c.city}` : ''}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Posts */}
      {posts.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            Posts · {posts.length}
          </h2>
          <div className="space-y-2">
            {posts.map(p => (
              <Link
                key={p.id}
                href={`/posts/${p.id}?from=search&searchBack=${encodeURIComponent(query)}`}
                className="block p-3 rounded-xl bg-gray-900/40 border border-gray-800 hover:border-purple-700/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500">{p.platforms.join(' + ')}</span>
                  <span className={`text-[10px] border rounded-full px-2 py-0.5 ml-auto ${
                    p.status === 'published' ? 'text-emerald-300 border-emerald-700/40 bg-emerald-950/20' :
                    p.status === 'failed'    ? 'text-red-300 border-red-700/40 bg-red-950/20' :
                    'text-gray-400 border-gray-700 bg-gray-800/20'
                  }`}>{p.status}</span>
                </div>
                <div className="text-sm text-white line-clamp-1">{p.brief || p.caption.substring(0, 80)}</div>
                {p.caption && p.brief && (
                  <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">{p.caption.substring(0, 100)}</div>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {total === 0 && (
        <EmptyState
          icon={Search}
          title={`Aucun résultat pour « ${query} »`}
          description="Essaie un autre terme — nom de client, ville, ou extrait de caption."
        />
      )}
    </div>
  )
}
