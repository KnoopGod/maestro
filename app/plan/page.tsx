import Image from 'next/image'
import Link from 'next/link'
import { listPosts } from '@/lib/db/queries/posts'
import { listClients } from '@/lib/db/queries/clients'
import { CalendarDays, ExternalLink, AlertCircle, Sparkles, Copy } from 'lucide-react'
import type { Post, PostStatus } from '@/types/post'
import type { Client } from '@/types/client'
import { getPostWorkflowProgress, progressBarClass } from '@/lib/workflow/post-progress'
import { PublishErrorHint } from '@/components/posts/PublishErrorHint'

export const dynamic = 'force-dynamic'

const PLATFORM_INFO: Record<string, { label: string; emoji: string; color: string }> = {
  instagram: { label: 'IG', emoji: '📷', color: 'bg-pink-600/20 text-pink-300 border-pink-700/40' },
  facebook:  { label: 'FB', emoji: '👍', color: 'bg-blue-600/20 text-blue-300 border-blue-700/40' },
  tiktok:    { label: 'TT', emoji: '🎵', color: 'bg-purple-600/20 text-purple-300 border-purple-700/40' },
  linkedin:  { label: 'LI', emoji: '💼', color: 'bg-sky-600/20 text-sky-300 border-sky-700/40' },
}

const STATUS_INFO: Record<string, { label: string; color: string; dot: string }> = {
  draft:     { label: 'Brouillon', color: 'bg-amber-900/40 text-amber-400 border-amber-800/40',  dot: 'bg-amber-400' },
  ready:     { label: 'Prêt',      color: 'bg-purple-900/40 text-purple-300 border-purple-700/40', dot: 'bg-purple-400' },
  scheduled: { label: 'Planifié',  color: 'bg-blue-900/40 text-blue-300 border-blue-800/40',       dot: 'bg-blue-400' },
  published: { label: 'Publié',    color: 'bg-emerald-900/40 text-emerald-400 border-emerald-800/40', dot: 'bg-emerald-400' },
  failed:    { label: 'Échec',     color: 'bg-red-900/40 text-red-400 border-red-800/40',         dot: 'bg-red-400' },
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'à l\'instant'
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h}h`
  return new Date(ts).toLocaleDateString('fr-FR')
}

export default async function PlanPage({ searchParams }: { searchParams: Promise<{ client?: string; status?: string }> }) {
  const { client: clientFilter, status: statusFilter } = await searchParams

  const [posts, clients] = await Promise.all([
    listPosts({
      clientId: clientFilter,
      status: statusFilter as PostStatus | undefined,
      limit: 100,
      includeInsights: false,
    }),
    listClients(),
  ])

  const clientsMap = new Map<string, Client>(clients.map(c => [c.id, c]))
  const totalPublished = posts.filter(p => p.status === 'published').length
  const totalScheduled = posts.filter(p => p.status === 'scheduled').length
  const totalDraft = posts.filter(p => p.status === 'draft').length
  const totalFailed = posts.filter(p => p.status === 'failed').length

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-purple-400" />
            Plan
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Historique de tous tes posts générés et publiés
          </p>
        </div>
        <Link
          href="/studio"
          title="Créer un nouveau post depuis le Studio"
          className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4" />
          Nouveau post
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatBox label="Total" value={posts.length} color="text-white" />
        <StatBox label="Publiés" value={totalPublished} color="text-emerald-400" />
        <StatBox label="Planifiés" value={totalScheduled} color="text-blue-400" />
        <StatBox label="Brouillons" value={totalDraft} color="text-amber-400" />
        <StatBox label="Échecs" value={totalFailed} color="text-red-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-gray-500">Filtres :</span>
        <FilterChip href="/plan" label="Tous" active={!clientFilter && !statusFilter} />
        <FilterChip href="/plan?status=scheduled" label="Planifiés" active={statusFilter === 'scheduled'} />
        <FilterChip href="/plan?status=published" label="Publiés" active={statusFilter === 'published'} />
        <FilterChip href="/plan?status=ready" label="Prêts" active={statusFilter === 'ready'} />
        <FilterChip href="/plan?status=draft" label="Brouillons" active={statusFilter === 'draft'} />
        <FilterChip href="/plan?status=failed" label="Échecs" active={statusFilter === 'failed'} />
        {clientFilter && (
          <Link
            href="/plan"
            title="Retirer le filtre client et afficher tous les posts"
            className="text-xs px-2 py-1 rounded bg-purple-600/30 border border-purple-600/40 text-purple-300"
          >
            Client : {clientsMap.get(clientFilter)?.name ?? '?'} ✕
          </Link>
        )}
      </div>

      {/* Posts list */}
      {posts.length === 0 ? (
        <div className="bg-gray-900/20 border border-dashed border-gray-700 rounded-2xl p-12 text-center">
          <Sparkles className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400">Aucun post pour le moment.</p>
          <Link
            href="/studio"
            title="Ouvrir le Studio pour générer le premier post"
            className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover:underline mt-3"
          >
            <Sparkles className="w-4 h-4" />
            Créer le premier post
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(p => {
            const client = clientsMap.get(p.clientId)
            return <PostRow key={p.id} post={p} client={client} />
          })}
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div title={`${label} : ${value}`} className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-2xl font-bold ${color} mt-1`}>{value}</div>
    </div>
  )
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      title={`Filtrer l'historique : ${label}`}
      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
        active
          ? 'bg-purple-600 text-white'
          : 'bg-gray-900 border border-gray-800 text-gray-400 hover:bg-gray-800'
      }`}
    >
      {label}
    </Link>
  )
}

function PostRow({ post, client }: { post: Post; client: Client | undefined }) {
  const statusCfg = STATUS_INFO[post.status]
  const progress = getPostWorkflowProgress(post.status, Boolean(post.supervisorReview))

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start gap-4">
        {/* Image / placeholder */}
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 relative">
          {post.imageUrl ? (
            <Image src={post.imageUrl} alt="" fill className="object-cover" sizes="80px" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${client?.color ?? 'from-gray-700 to-gray-900'} flex items-center justify-center text-2xl`}>
              {client?.emoji ?? '📝'}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span title={`Statut : ${statusCfg.label}`} className={`text-[10px] border rounded-full px-2 py-0.5 ${statusCfg.color} flex items-center gap-1`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
            {client && (
              <Link
                href={`/clients/${client.id}`}
                title={`Ouvrir la fiche client de ${client.name}`}
                className="text-xs text-purple-300 hover:underline flex items-center gap-1"
              >
                {client.emoji} {client.name}
              </Link>
            )}
            {post.platforms.map(p => (
              <span
                key={p}
                title={`Plateforme cible : ${PLATFORM_INFO[p]?.label ?? p}`}
                className={`text-[10px] border rounded px-1.5 py-0.5 ${PLATFORM_INFO[p]?.color ?? 'border-gray-700 text-gray-400'}`}
              >
                {PLATFORM_INFO[p]?.emoji} {PLATFORM_INFO[p]?.label}
              </span>
            ))}
            <span className="text-[11px] text-gray-500 ml-auto">
              {post.publishedAt ? `Publié ${formatRelative(post.publishedAt)}` : `Créé ${formatRelative(post.createdAt)}`}
            </span>
          </div>

          <p className="text-sm text-gray-200 line-clamp-2 leading-snug">
            {post.caption}
          </p>

          {post.hashtags.length > 0 && (
            <p className="text-[11px] text-blue-400 mt-1 line-clamp-1">
              {post.hashtags.slice(0, 5).map(h => `#${h.replace(/^#/, '')}`).join(' ')}
            </p>
          )}

          {/* Error if failed */}
          {post.status === 'failed' && post.error && (
            <>
              <div className="mt-2 p-2 rounded-lg bg-red-950/30 border border-red-700/30 text-xs text-red-300 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{post.error}</span>
              </div>
              <PublishErrorHint error={post.error} clientId={post.clientId} />
            </>
          )}

          {/* Published links */}
          {post.status === 'published' && Object.keys(post.metaPostIds).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(post.metaPostIds).map(([platform, postId]) => {
                const cfg = PLATFORM_INFO[platform]
                const url = platform === 'facebook'
                  ? `https://www.facebook.com/${postId}`
                  : platform === 'instagram'
                    ? `https://www.instagram.com/p/${postId}`
                    : '#'
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Ouvrir le post publié sur ${cfg?.label ?? platform}`}
                    className={`text-[11px] px-2 py-1 rounded border ${cfg?.color} flex items-center gap-1 hover:underline`}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Voir sur {cfg?.label}
                  </a>
                )
              })}
            </div>
          )}

          {/* Meta */}
          <div className="mt-3 rounded-lg border border-gray-800 bg-gray-950/40 p-2">
            <div className="flex items-center justify-between gap-3 text-[10px] text-gray-500 mb-1.5">
              <span>{progress.currentStep}</span>
              <span>{progress.percent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
              <div className={`h-full ${progressBarClass(progress.tone)}`} style={{ width: `${progress.percent}%` }} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[10px] text-gray-600">
              <span>Prochaine étape : {progress.nextStep}</span>
              <span>ETA : {progress.eta}</span>
              <span>{formatTime(post.createdAt)}</span>
              {post.impactScore > 0 && <span>Impact {post.impactScore}/100</span>}
              {post.cost > 0 && <span>${post.cost.toFixed(4)}</span>}
              <Link
                href={`/studio?cloneFrom=${post.id}`}
                title="Réutiliser le brief de ce post comme template dans le Studio"
                className="ml-auto flex items-center gap-1 text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                <Copy className="w-3 h-3" />
                Réutiliser
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
