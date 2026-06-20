import Link from 'next/link'
import { listPosts } from '@/lib/db/queries/posts'
import { listClients } from '@/lib/db/queries/clients'
import { CalendarDays, ExternalLink, AlertCircle, Sparkles } from 'lucide-react'
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
  draft:     { label: 'Brouillon', color: 'bg-gray-700/40 text-gray-400 border-gray-700',             dot: 'bg-gray-400' },
  ready:     { label: 'Prêt',      color: 'bg-emerald-900/30 text-emerald-400 border-emerald-800/40', dot: 'bg-emerald-400' },
  scheduled: { label: 'Planifié',  color: 'bg-blue-900/30 text-blue-400 border-blue-800/40',          dot: 'bg-blue-400' },
  published: { label: 'Publié',    color: 'bg-purple-900/30 text-purple-400 border-purple-800/40',    dot: 'bg-purple-400' },
  failed:    { label: 'Échec',     color: 'bg-red-900/30 text-red-400 border-red-800/40',             dot: 'bg-red-400' },
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
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-purple-400" />
            Plan
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Historique de tous tes posts générés et publiés
          </p>
        </div>
        <Link
          href="/studio"
          title="Créer un nouveau post depuis le Studio"
          className="group px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 active:scale-[0.98] text-white text-sm font-medium flex items-center gap-2 transition-all duration-150 shadow-lg shadow-purple-900/30"
        >
          <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform duration-150" />
          Nouveau post
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatBox label="Total"      value={posts.length}    color="text-white"      bg="bg-gray-900/40"    border="border-gray-800" />
        <StatBox label="Publiés"    value={totalPublished}  color="text-purple-400" bg="bg-purple-900/10"  border="border-purple-800/40" />
        <StatBox label="Planifiés"  value={totalScheduled}  color="text-blue-400"   bg="bg-blue-900/10"    border="border-blue-800/40" />
        <StatBox label="Brouillons" value={totalDraft}      color="text-gray-400"   bg="bg-gray-900/40"    border="border-gray-800" />
        <StatBox label="Échecs"     value={totalFailed}     color="text-red-400"    bg="bg-red-900/10"     border="border-red-800/40" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-gray-500 font-medium">Filtres :</span>
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
            className="text-xs px-2.5 py-1.5 rounded-lg bg-purple-600/30 border border-purple-600/40 text-purple-300 hover:bg-purple-600/40 transition-colors duration-150 flex items-center gap-1"
          >
            {clientsMap.get(clientFilter)?.name ?? '?'} ✕
          </Link>
        )}
      </div>

      {/* Posts list */}
      {posts.length === 0 ? (
        <div className="bg-gray-900/40 border border-dashed border-gray-700 rounded-2xl p-12 text-center">
          <Sparkles className="w-10 h-10 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 font-medium text-sm">Aucun post pour le moment.</p>
          <p className="text-gray-600 text-xs mt-1">
            {statusFilter ? `Aucun post avec le statut « ${statusFilter} ».` : 'Commencez par générer votre premier post dans le Studio.'}
          </p>
          <Link
            href="/studio"
            title="Ouvrir le Studio pour générer le premier post"
            className="group inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-300 hover:text-white hover:bg-gray-800 hover:border-gray-600 transition-all duration-150"
          >
            <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform duration-150" />
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

function StatBox({ label, value, color, bg, border }: { label: string; value: number; color: string; bg: string; border: string }) {
  return (
    <div title={`${label} : ${value}`} className={`${bg} border ${border} rounded-xl p-4 hover:-translate-y-0.5 transition-transform duration-200`}>
      <div className="text-xs text-gray-500 font-medium">{label}</div>
      <div className={`text-2xl font-bold ${color} mt-1.5`}>{value}</div>
    </div>
  )
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      title={`Filtrer l'historique : ${label}`}
      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-150 ${
        active
          ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
          : 'bg-gray-900/60 border border-gray-800 text-gray-400 hover:bg-gray-800 hover:border-gray-700 hover:text-gray-300'
      }`}
    >
      {label}
    </Link>
  )
}

function PostRow({ post, client }: { post: Post; client: Client | undefined }) {
  const statusCfg = STATUS_INFO[post.status] ?? STATUS_INFO.draft
  const progress = getPostWorkflowProgress(post.status, Boolean(post.supervisorReview))

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 hover:border-gray-700 hover:shadow-[0_0_16px_rgba(0,0,0,0.3)] transition-all duration-150">
      <div className="flex items-start gap-4">
        {/* Image / placeholder */}
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-gray-800">
          {post.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.imageUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${client?.color ?? 'from-gray-700 to-gray-900'} flex items-center justify-center text-2xl`}>
              {client?.emoji ?? '📝'}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span title={`Statut : ${statusCfg.label}`} className={`text-[11px] border rounded-full px-2 py-0.5 ${statusCfg.color} flex items-center gap-1 font-medium`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              {statusCfg.label}
            </span>
            {client && (
              <Link
                href={`/clients/${client.id}`}
                title={`Ouvrir la fiche client de ${client.name}`}
                className="text-xs text-purple-300 hover:text-purple-200 transition-colors flex items-center gap-1 font-medium"
              >
                {client.emoji} {client.name}
              </Link>
            )}
            {post.platforms.map(p => (
              <span
                key={p}
                title={`Plateforme cible : ${PLATFORM_INFO[p]?.label ?? p}`}
                className={`text-[11px] border rounded-md px-1.5 py-0.5 font-medium ${PLATFORM_INFO[p]?.color ?? 'border-gray-700 text-gray-400'}`}
              >
                {PLATFORM_INFO[p]?.emoji} {PLATFORM_INFO[p]?.label}
              </span>
            ))}
            <span className="text-xs text-gray-500 ml-auto">
              {post.publishedAt ? `Publié ${formatRelative(post.publishedAt)}` : `Créé ${formatRelative(post.createdAt)}`}
            </span>
          </div>

          <p className="text-sm text-gray-200 line-clamp-2 leading-snug">
            {post.caption}
          </p>

          {post.hashtags.length > 0 && (
            <p className="text-[11px] text-blue-400/80 mt-1.5 line-clamp-1 font-mono">
              {post.hashtags.slice(0, 5).map(h => `#${h.replace(/^#/, '')}`).join(' ')}
            </p>
          )}

          {/* Error if failed */}
          {post.status === 'failed' && post.error && (
            <>
              <div className="mt-2 p-3 rounded-lg bg-red-950/30 border border-red-700/30 text-xs text-red-300 flex items-start gap-2">
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
                    className={`text-[11px] px-2 py-1 rounded-lg border ${cfg?.color} flex items-center gap-1 hover:opacity-80 transition-opacity duration-150 font-medium`}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Voir sur {cfg?.label}
                  </a>
                )
              })}
            </div>
          )}

          {/* Progress bar */}
          <div className="mt-3 rounded-lg border border-gray-800 bg-gray-950/40 p-3">
            <div className="flex items-center justify-between gap-3 text-xs text-gray-500 mb-2">
              <span className="font-medium">{progress.currentStep}</span>
              <span className="font-mono text-gray-400">{progress.percent}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
              <div className={`h-full ${progressBarClass(progress.tone)} transition-all duration-500`} style={{ width: `${progress.percent}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
              <span>Prochaine étape : {progress.nextStep}</span>
              <span>ETA : {progress.eta}</span>
              <span>{formatTime(post.createdAt)}</span>
              {post.impactScore > 0 && <span className="text-gray-500">Impact <span className="text-gray-400 font-medium">{post.impactScore}/100</span></span>}
              {post.cost > 0 && <span className="text-gray-500 font-mono">${post.cost.toFixed(4)}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
