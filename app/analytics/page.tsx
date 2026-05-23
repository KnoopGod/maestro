import Link from 'next/link'
import { BarChart3, TrendingUp, Users, Eye } from 'lucide-react'
import { listPosts } from '@/lib/db/queries/posts'
import { listClients } from '@/lib/db/queries/clients'
import { PerformancePanel } from '@/components/analytics/PerformancePanel'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const [posts, clients] = await Promise.all([listPosts({ limit: 500 }), listClients()])
  const published = posts.filter(p => p.status === 'published')
  const draft = posts.filter(p => p.status === 'draft')
  const failed = posts.filter(p => p.status === 'failed')

  const postsPerClient = clients.map(c => ({
    client: c,
    count: published.filter(p => p.clientId === c.id).length,
  })).sort((a, b) => b.count - a.count)

  const clientsWithPublished = clients.filter(c =>
    published.some(p => p.clientId === c.id)
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-emerald-400" />
          Analytics
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Vue d&apos;ensemble des performances · {published.length} posts publiés
        </p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card label="Posts publiés"   value={published.length} icon={TrendingUp} color="text-emerald-400" />
        <Card label="Brouillons"      value={draft.length}     icon={BarChart3}  color="text-amber-400" />
        <Card label="Échecs"          value={failed.length}    icon={Eye}        color="text-red-400" />
        <Card label="Clients actifs"  value={clients.filter(c => c.status === 'active').length} icon={Users} color="text-purple-400" />
      </div>

      {/* Performance Analyst */}
      <PerformancePanel clients={clientsWithPublished} />

      {/* Per-client breakdown */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Posts publiés par client</h2>

        {postsPerClient.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            Pas encore de posts publiés. <Link href="/studio" className="text-purple-400 hover:underline">Créer le premier</Link>
          </p>
        ) : (
          <div className="space-y-2">
            {postsPerClient.map(({ client, count }) => {
              const max = Math.max(...postsPerClient.map(x => x.count), 1)
              return (
                <Link
                  key={client.id}
                  href={`/plan?client=${client.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-800/40 transition-colors group"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${client.color} flex items-center justify-center text-lg flex-shrink-0`}>
                    {client.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{client.name}</div>
                    <div className="mt-1.5 w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-500"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-white">{count}</div>
                    <div className="text-[10px] text-gray-500">posts</div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function Card({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
  )
}
