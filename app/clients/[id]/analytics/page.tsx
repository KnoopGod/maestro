import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, BarChart3, ExternalLink } from 'lucide-react'
import { getClient } from '@/lib/db/queries/clients'
import { listPosts } from '@/lib/db/queries/posts'
import { FetchInsightsButton } from '@/components/analytics/FetchInsightsButton'
import type { Post, PostInsights } from '@/types/post'

export const dynamic = 'force-dynamic'

export default async function ClientAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await getClient(id)
  if (!client) notFound()

  const posts = (await listPosts({ clientId: id, status: 'published', limit: 100 }))
    .filter(post => Object.keys(post.metaPostIds).length > 0)

  return (
    <div className="space-y-6 max-w-6xl">
      <Link href={`/clients/${client.id}`} title={`Retourner à la fiche de ${client.name}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Retour à {client.name}
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-emerald-400" />
          Analytics · {client.name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Posts publiés, identifiants Meta et métriques simples pour optimiser les prochains contenus.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="bg-gray-900/20 border border-dashed border-gray-700 rounded-2xl p-10 text-center">
          <BarChart3 className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400">Aucun post publié avec identifiant Meta pour ce client.</p>
          <Link href={`/studio?client=${client.id}`} title={`Créer un post publié mesurable pour ${client.name}`} className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover:underline mt-3">
            Créer un post
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => <AnalyticsPostRow key={post.id} post={post} />)}
        </div>
      )}
    </div>
  )
}

function AnalyticsPostRow({ post }: { post: Post }) {
  return (
    <article title="Post publié avec identifiants Meta et métriques récupérables" className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-start gap-4">
        {post.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.imageUrl} alt="" loading="lazy" decoding="async" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-gray-950 border border-gray-800 flex items-center justify-center text-2xl flex-shrink-0">
            📊
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[10px] rounded-full border border-emerald-700/40 bg-emerald-950/20 text-emerald-300 px-2 py-0.5">
              Publié
            </span>
            {post.publishedAt && (
              <span className="text-[10px] text-gray-500">
                {new Date(post.publishedAt).toLocaleString('fr-FR')}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-200 line-clamp-2">{post.caption}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(post.metaPostIds).map(([platform, id]) => (
              <span key={`${platform}-${id}`} title={`Identifiant Meta utilisé pour récupérer les insights ${platform}`} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-950/50 px-2 py-1 text-[11px] text-gray-300">
                <ExternalLink className="w-3 h-3 text-gray-500" />
                {platform}: {id}
              </span>
            ))}
          </div>
        </div>
        <FetchInsightsButton postId={post.id} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {post.metaInsights.length === 0 ? (
          <div className="sm:col-span-3 rounded-xl border border-gray-800 bg-gray-950/40 p-3 text-xs text-gray-500">
            Aucun insight récupéré pour ce post.
          </div>
        ) : (
          post.metaInsights.map(insight => <InsightCard key={`${insight.platform}-${insight.fetchedAt}`} insight={insight} />)
        )}
      </div>
    </article>
  )
}

function InsightCard({ insight }: { insight: PostInsights }) {
  return (
    <div title={`Insights récupérés depuis Meta pour ${insight.platform}`} className="rounded-xl border border-gray-800 bg-gray-950/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">{insight.platform}</div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Metric label="Reach" value={insight.reach} />
        <Metric label="Likes" value={insight.likes} />
        <Metric label="Com." value={insight.comments} />
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div title={`${label} : ${value.toLocaleString()}`}>
      <div className="text-base font-semibold text-white">{value.toLocaleString()}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  )
}
