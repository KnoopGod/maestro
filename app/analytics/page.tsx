import Link from 'next/link'
import { BarChart3, TrendingUp, Users, Eye, Sparkles } from 'lucide-react'
import { listPosts } from '@/lib/db/queries/posts'
import { listClients } from '@/lib/db/queries/clients'
import { PerformancePanel } from '@/components/analytics/PerformancePanel'
import { EmptyState } from '@/components/ui/EmptyState'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const [posts, clients] = await Promise.all([
    listPosts({ statuses: ['published', 'draft', 'failed'], limit: 500, includeInsights: false }),
    listClients(),
  ])
  const published = posts.filter(p => p.status === 'published')
  const draft = posts.filter(p => p.status === 'draft')
  const failed = posts.filter(p => p.status === 'failed')

  const postsPerClient = clients.map(c => ({
    client: c,
    count: published.filter(p => p.clientId === c.id).length,
  })).sort((a, b) => b.count - a.count)

  // Pillar breakdown
  const pillarMap = new Map<string, number>()
  for (const p of published) {
    const pillar = p.pillar ?? 'Non catégorisé'
    pillarMap.set(pillar, (pillarMap.get(pillar) ?? 0) + 1)
  }
  const pillarBreakdown = Array.from(pillarMap.entries())
    .map(([pillar, count]) => ({ pillar, count }))
    .sort((a, b) => b.count - a.count)

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card label="Posts publiés"  value={published.length} icon={TrendingUp} color="text-emerald-400" grad="from-emerald-950/40" border="border-emerald-800/30" />
        <Card label="Brouillons"     value={draft.length}     icon={BarChart3}  color="text-amber-400"  grad="from-amber-950/40"  border="border-amber-800/30" />
        <Card label="Échecs"         value={failed.length}    icon={Eye}        color="text-red-400"    grad="from-red-950/40"    border="border-red-800/30" />
        <Card label="Clients actifs" value={clients.filter(c => c.status === 'active').length} icon={Users} color="text-purple-400" grad="from-purple-950/40" border="border-purple-800/30" />
      </div>

      {/* Performance Analyst */}
      <PerformancePanel clients={clientsWithPublished} />

      {/* Pillar breakdown */}
      {pillarBreakdown.length > 0 && (
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Posts par pilier de contenu</h2>
          <div className="space-y-2">
            {pillarBreakdown.map(({ pillar, count }) => {
              const max = Math.max(...pillarBreakdown.map(x => x.count), 1)
              return (
                <div key={pillar} className="flex items-center gap-4">
                  <span className="text-xs text-gray-300 w-40 truncate flex-shrink-0">{pillar}</span>
                  <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 to-purple-500 transition-all duration-300"
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white w-8 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Per-client breakdown */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Posts publiés par client</h2>

        {postsPerClient.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="Pas encore de posts publiés"
            description="Les statistiques apparaîtront dès que tu publies des contenus pour tes clients."
            cta={{ label: 'Créer un post', href: '/studio', icon: Sparkles }}
          />
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
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${client.color} flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-105 transition-transform duration-200`}>
                    {client.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{client.name}</div>
                    <div className="mt-1.5 w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all duration-300"
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

function Card({ label, value, icon: Icon, color, grad, border }: {
  label: string
  value: number
  icon: React.ElementType
  color: string
  grad: string
  border: string
}) {
  return (
    <div className={`bg-gradient-to-br ${grad} to-gray-900/40 border ${border} rounded-xl p-5 hover:-translate-y-0.5 hover:shadow-md hover:shadow-purple-900/10 transition-all duration-200 group`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        <Icon className={`w-4 h-4 ${color} group-hover:scale-110 transition-transform duration-200`} />
      </div>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
    </div>
  )
}
