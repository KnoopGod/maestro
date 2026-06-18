import Image from 'next/image'
import Link from 'next/link'
import { listPosts, countPosts } from '@/lib/db/queries/posts'
import { listClients } from '@/lib/db/queries/clients'
import { CalendarDays, ExternalLink, AlertCircle, Sparkles, Copy, Download } from 'lucide-react'
import type { Post, PostStatus, PostContentType } from '@/types/post'
import type { Client } from '@/types/client'
import { buildFilterUrl } from '@/lib/utils'
import { getPostWorkflowProgress, progressBarClass } from '@/lib/workflow/post-progress'
import { PublishErrorHint } from '@/components/posts/PublishErrorHint'
import { PlanSearchInput } from '@/components/plan/PlanSearchInput'
import { DuplicatePostButton } from '@/components/posts/DuplicatePostButton'
import { MarkReadyButton } from '@/components/posts/MarkReadyButton'
import { InlineSchedulePicker } from '@/components/plan/InlineSchedulePicker'
import { HighlightText } from '@/components/plan/HighlightText'

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

type PlanSort = 'newest' | 'oldest' | 'impact' | 'scheduled'

const CONTENT_TYPE_LABELS: Record<string, string> = { photo: 'Photo', reel: 'Reel', story: 'Story' }

export default async function PlanPage({ searchParams }: { searchParams: Promise<{ client?: string; status?: string; q?: string; platform?: string; type?: string; sort?: string; pillar?: string }> }) {
  const { client: clientFilter, status: statusFilter, q: searchQuery, platform: platformFilter, type: typeFilter, sort: sortParam, pillar: pillarFilter } = await searchParams
  const contentTypeFilter = typeFilter as PostContentType | undefined
  const sortOption: PlanSort = (['newest', 'oldest', 'impact', 'scheduled'] as PlanSort[]).includes(sortParam as PlanSort) ? sortParam as PlanSort : 'newest'

  const orderBy = sortOption === 'impact' ? 'impact_score' as const : sortOption === 'scheduled' ? 'scheduled_at' as const : 'created_at' as const
  const orderDir = sortOption === 'oldest' ? 'ASC' as const : 'DESC' as const

  const showInsights = statusFilter === 'published'
  const [posts, allPosts, clients, countBaseList, totalPostsCount] = await Promise.all([
    listPosts({
      clientId: clientFilter,
      status: statusFilter as PostStatus | undefined,
      limit: 100,
      includeInsights: showInsights,
      q: searchQuery,
      platform: platformFilter,
      contentType: contentTypeFilter,
      pillar: pillarFilter,
      orderBy,
      orderDir,
    }),
    clientFilter
      ? listPosts({ limit: 200, includeInsights: false })
      : Promise.resolve(null as null),
    listClients(),
    // Stat box counts must ignore the status filter but keep all other active filters
    statusFilter
      ? listPosts({ clientId: clientFilter, limit: 200, includeInsights: false, q: searchQuery, platform: platformFilter, contentType: contentTypeFilter, pillar: pillarFilter })
      : Promise.resolve(null as null),
    // Accurate total count (not limited to 100)
    countPosts({ clientId: clientFilter, q: searchQuery, platform: platformFilter, contentType: contentTypeFilter, pillar: pillarFilter }),
  ])

  const clientsMap = new Map<string, Client>(clients.map(c => [c.id, c]))

  // Per-client counts from the unfiltered set (for chips)
  const baseList = allPosts ?? posts
  const countByClient = baseList.reduce<Record<string, number>>((acc, p) => {
    acc[p.clientId] = (acc[p.clientId] ?? 0) + 1
    return acc
  }, {})
  const clientsWithPosts = clients.filter(c => countByClient[c.id])

  // Stat counts: use countBaseList when status filter is active to show real totals
  const statBase = countBaseList ?? posts

  // Encoded active filter state to pass through to post detail for a correct back-link
  const activePlanParams = new URLSearchParams()
  if (clientFilter) activePlanParams.set('client', clientFilter)
  if (statusFilter) activePlanParams.set('status', statusFilter)
  if (searchQuery) activePlanParams.set('q', searchQuery)
  if (platformFilter) activePlanParams.set('platform', platformFilter)
  if (typeFilter) activePlanParams.set('type', typeFilter)
  if (pillarFilter) activePlanParams.set('pillar', pillarFilter)
  if (sortOption !== 'newest') activePlanParams.set('sort', sortOption)
  const activePlanStr = activePlanParams.toString()

  // Build URL helper preserving all active filters
  function planUrl(overrides: Record<string, string | undefined>) {
    return buildFilterUrl('/plan', {
      client: clientFilter, status: statusFilter, q: searchQuery, platform: platformFilter, type: typeFilter,
      pillar: pillarFilter, sort: sortOption !== 'newest' ? sortOption : undefined,
      ...overrides,
    })
  }

  const hasActiveFilters = [clientFilter, statusFilter, searchQuery, platformFilter, typeFilter, pillarFilter].some(Boolean)

  // Platforms actually present in results (for chips)
  const platformsInResults = [...new Set(posts.flatMap(p => p.platforms))]

  // Content types present in results (for chips)
  const contentTypesInResults = [...new Set(posts.map(p => p.contentType))]

  // Pillars present in results (for chips) — use base list for counts when filtering
  const pillarBaseList = allPosts ?? posts
  const pillarsInResults = [...new Set(pillarBaseList.map(p => p.pillar).filter(Boolean) as string[])].sort()
  const totalPublished = statBase.filter(p => p.status === 'published').length
  const totalScheduled = statBase.filter(p => p.status === 'scheduled').length
  const totalDraft = statBase.filter(p => p.status === 'draft').length
  const totalFailed = statBase.filter(p => p.status === 'failed').length

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
        <div className="flex gap-2">
          <Link
            href={(() => {
              const p = new URLSearchParams()
              if (clientFilter) p.set('clientId', clientFilter)
              if (statusFilter) p.set('status', statusFilter)
              if (searchQuery) p.set('q', searchQuery)
              if (platformFilter) p.set('platform', platformFilter)
              if (typeFilter) p.set('contentType', typeFilter)
              if (pillarFilter) p.set('pillar', pillarFilter)
              const str = p.toString()
              return `/api/posts/export${str ? `?${str}` : ''}`
            })()}
            title="Exporter les posts filtrés en CSV"
            className="px-3 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV
          </Link>
          <Link
            href={clientFilter ? `/studio?client=${clientFilter}` : '/studio'}
            title="Créer un nouveau post depuis le Studio"
            className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            Nouveau post
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatBox label="Total"      value={totalPostsCount}   color="text-white"       href={planUrl({ status: undefined })}    active={!statusFilter} />
        <StatBox label="Publiés"    value={totalPublished} color="text-emerald-400" href={planUrl({ status: 'published' })}  active={statusFilter === 'published'} />
        <StatBox label="Planifiés"  value={totalScheduled} color="text-blue-400"    href={planUrl({ status: 'scheduled' })}  active={statusFilter === 'scheduled'} />
        <StatBox label="Brouillons" value={totalDraft}     color="text-amber-400"   href={planUrl({ status: 'draft' })}      active={statusFilter === 'draft'} />
        <StatBox label="Échecs"     value={totalFailed}    color="text-red-400"     href={planUrl({ status: 'failed' })}     active={statusFilter === 'failed'} />
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500">Filtres :</span>
          <FilterChip href="/plan" label="Tous" active={!hasActiveFilters} />
          {([
            ['scheduled', 'Planifiés'],
            ['published', 'Publiés'],
            ['ready',     'Prêts'],
            ['draft',     'Brouillons'],
            ['failed',    'Échecs'],
          ] as [string, string][]).map(([val, label]) => (
            <FilterChip
              key={val}
              href={planUrl({ status: statusFilter === val ? undefined : val })}
              label={label}
              active={statusFilter === val}
            />
          ))}
          {clientsWithPosts.length > 1 && (
            <>
              <span className="text-xs text-gray-700 mx-1">|</span>
              {clientsWithPosts.map(c => {
                const isActive = clientFilter === c.id
                return (
                  <Link
                    key={c.id}
                    href={isActive ? planUrl({ client: undefined }) : planUrl({ client: c.id })}
                    title={isActive ? `Retirer le filtre ${c.name}` : `Filtrer : ${c.name}`}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      isActive
                        ? 'border-purple-600/60 bg-purple-600/20 text-purple-300'
                        : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                    }`}
                  >
                    {c.emoji} {c.name} ({countByClient[c.id] ?? 0}){isActive ? ' ✕' : ''}
                  </Link>
                )
              })}
            </>
          )}
          {/* Platform filter chips */}
          {(platformsInResults.length > 1 || platformFilter) && (
            <>
              <span className="text-xs text-gray-700 mx-1">|</span>
              {platformFilter && (
                <Link href={planUrl({ platform: undefined })} title="Retirer le filtre plateforme" className="text-xs px-2 py-1 rounded bg-blue-600/20 border border-blue-600/30 text-blue-300">
                  {PLATFORM_INFO[platformFilter]?.emoji} {PLATFORM_INFO[platformFilter]?.label} ✕
                </Link>
              )}
              {!platformFilter && platformsInResults.map(p => (
                <Link key={p} href={planUrl({ platform: p })} title={`Filtrer : ${PLATFORM_INFO[p]?.label ?? p} uniquement`}
                  className="text-xs px-2 py-1 rounded border border-gray-700 text-gray-400 hover:border-blue-700/50 hover:text-blue-300 transition-colors">
                  {PLATFORM_INFO[p]?.emoji} {PLATFORM_INFO[p]?.label ?? p}
                </Link>
              ))}
            </>
          )}
          {/* Content type filter */}
          {(contentTypesInResults.length > 1 || typeFilter) && (
            <>
              <span className="text-xs text-gray-700 mx-1">|</span>
              {typeFilter && (
                <Link href={planUrl({ type: undefined })} title="Retirer le filtre type" className="text-xs px-2 py-1 rounded bg-indigo-600/20 border border-indigo-600/30 text-indigo-300">
                  {CONTENT_TYPE_LABELS[typeFilter] ?? typeFilter} ✕
                </Link>
              )}
              {!typeFilter && contentTypesInResults.map(ct => (
                <Link key={ct} href={planUrl({ type: ct })} title={`Filtrer par type : ${CONTENT_TYPE_LABELS[ct] ?? ct}`}
                  className="text-xs px-2 py-1 rounded border border-gray-700 text-gray-400 hover:border-indigo-700/50 hover:text-indigo-300 transition-colors">
                  {CONTENT_TYPE_LABELS[ct] ?? ct}
                </Link>
              ))}
            </>
          )}
          {/* Pillar filter */}
          {(pillarsInResults.length > 1 || pillarFilter) && (
            <>
              <span className="text-xs text-gray-700 mx-1">|</span>
              {pillarFilter && (
                <Link href={planUrl({ pillar: undefined })} title="Retirer le filtre pilier" className="text-xs px-2 py-1 rounded bg-violet-600/20 border border-violet-600/30 text-violet-300">
                  {pillarFilter} ✕
                </Link>
              )}
              {!pillarFilter && pillarsInResults.map(pl => (
                <Link key={pl} href={planUrl({ pillar: pl })} title={`Filtrer par pilier : ${pl}`}
                  className="text-xs px-2 py-1 rounded border border-gray-700 text-gray-400 hover:border-violet-700/50 hover:text-violet-300 transition-colors">
                  {pl}
                </Link>
              ))}
            </>
          )}
          {/* Reset filters — shown when ≥2 filters active */}
          {[clientFilter, statusFilter, searchQuery, platformFilter, typeFilter, pillarFilter, sortOption !== 'newest' ? sortOption : undefined].filter(Boolean).length >= 2 && (
            <Link
              href="/plan"
              title="Effacer tous les filtres actifs"
              className="ml-auto text-xs px-2 py-1 rounded border border-red-800/40 text-red-400/60 hover:border-red-700/60 hover:text-red-400 transition-colors"
            >
              ✕ Effacer les filtres
            </Link>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">Tri :</span>
          {([
            ['newest',    'Récent'],
            ['oldest',    'Ancien'],
            ['impact',    'Impact ↓'],
            ['scheduled', 'Planifié ↑'],
          ] as [PlanSort, string][]).map(([val, label]) => (
            <Link
              key={val}
              href={planUrl({ sort: val !== 'newest' ? val : undefined })}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                sortOption === val
                  ? 'border-purple-600/60 bg-purple-600/20 text-purple-300'
                  : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-300'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <PlanSearchInput initialQ={searchQuery} />
        {searchQuery && (
          <p className="text-[11px] text-gray-500">
            {posts.length} résultat{posts.length !== 1 ? 's' : ''} pour <span className="text-purple-300">&ldquo;{searchQuery}&rdquo;</span>
          </p>
        )}
      </div>

      {/* Posts list */}
      {posts.length === 0 ? (
        <div className="bg-gray-900/20 border border-dashed border-gray-700 rounded-2xl p-12 text-center">
          <Sparkles className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          {(clientFilter || statusFilter || searchQuery || platformFilter || typeFilter || pillarFilter) ? (
            <>
              <p className="text-gray-400">Aucun post ne correspond à ces filtres.</p>
              <Link href="/plan" title="Effacer tous les filtres" className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover:underline mt-3">
                Effacer les filtres →
              </Link>
            </>
          ) : (
            <>
              <p className="text-gray-400">Aucun post pour le moment.</p>
              <Link href="/studio" title="Ouvrir le Studio pour générer le premier post" className="inline-flex items-center gap-1.5 text-sm text-purple-400 hover:underline mt-3">
                <Sparkles className="w-4 h-4" />
                Créer le premier post
              </Link>
            </>
          )}
        </div>
      ) : (
        <MonthGroupedPosts posts={posts} clientsMap={clientsMap} searchQuery={searchQuery} now={new Date().getTime()} activePlanStr={activePlanStr} planUrl={planUrl} />
      )}
    </div>
  )
}

const STATUS_BADGE_COLOR: Record<string, string> = {
  published: 'bg-emerald-500/20 text-emerald-400',
  scheduled: 'bg-blue-500/20 text-blue-400',
  ready:     'bg-purple-500/20 text-purple-400',
  draft:     'bg-amber-500/20 text-amber-400',
  failed:    'bg-red-500/20 text-red-400',
}

function getPostMonth(post: Post): string {
  const ts = post.publishedAt ?? post.scheduledAt ?? post.createdAt
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(key: string): string {
  if (key === 'none') return 'Sans date'
  const [year, month] = key.split('-')
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
}

function MonthGroupedPosts({ posts, clientsMap, searchQuery, now, activePlanStr, planUrl }: { posts: Post[]; clientsMap: Map<string, Client>; searchQuery?: string; now: number; activePlanStr?: string; planUrl: (overrides: Record<string, string | undefined>) => string }) {
  const adjacency = new Map(posts.map((p, i) => [p.id, { prevId: posts[i - 1]?.id, nextId: posts[i + 1]?.id }]))
  const groups = new Map<string, Post[]>()
  for (const post of posts) {
    const key = getPostMonth(post)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(post)
  }

  const sortedKeys = [...groups.keys()].sort((a, b) => (a === 'none' ? 1 : b === 'none' ? -1 : b.localeCompare(a)))
  const currentMonthKey = (() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })()

  return (
    <div className="space-y-8">
      {/* Month anchor navigation */}
      {sortedKeys.length > 1 && (
        <div className="flex flex-wrap gap-2 pb-1 border-b border-gray-800">
          {sortedKeys.map(key => (
            <a
              key={key}
              href={`#month-${key}`}
              title={`Aller à ${formatMonthLabel(key)}`}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors capitalize ${
                key === currentMonthKey
                  ? 'bg-purple-600/30 border border-purple-600/40 text-purple-300'
                  : 'bg-gray-900 border border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              {formatMonthLabel(key)}
            </a>
          ))}
        </div>
      )}

      {sortedKeys.map(key => {
        const group = groups.get(key)!
        const statusCounts = group.reduce<Record<string, number>>((acc, p) => {
          acc[p.status] = (acc[p.status] ?? 0) + 1
          return acc
        }, {})
        return (
          <div key={key} id={`month-${key}`}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-sm font-semibold text-gray-400 capitalize">
                {formatMonthLabel(key)}
              </h2>
              <span className="text-xs text-gray-600">{group.length} post{group.length > 1 ? 's' : ''}</span>
              <div className="flex gap-1.5">
                {Object.entries(statusCounts).map(([status, count]) => (
                  <span
                    key={status}
                    title={`${STATUS_INFO[status]?.label ?? status} : ${count}`}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${STATUS_BADGE_COLOR[status] ?? 'bg-gray-700 text-gray-400'}`}
                  >
                    {count} {STATUS_INFO[status]?.label ?? status}
                  </span>
                ))}
              </div>
              <div className="flex-1 h-px bg-gray-800" />
            </div>
            <div className="space-y-3">
              {group.map(p => {
                const prevId = adjacency.get(p.id)?.prevId
                const nextId = adjacency.get(p.id)?.nextId
                const detailHref = `/posts/${p.id}?from=plan${prevId ? `&prevId=${prevId}` : ''}${nextId ? `&nextId=${nextId}` : ''}${activePlanStr ? '&planBack=' + encodeURIComponent(activePlanStr) : ''}`
                return <PostRow key={p.id} post={p} client={clientsMap.get(p.clientId)} searchQuery={searchQuery} now={now} detailHref={detailHref} planUrl={planUrl} />
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StatBox({ label, value, color, href, active }: { label: string; value: number; color: string; href?: string; active?: boolean }) {
  const inner = (
    <div title={`Filtrer : ${label}`} className={`bg-gray-900/40 border rounded-xl p-4 transition-colors ${
      active ? 'border-purple-700/60 bg-purple-950/10' : 'border-gray-800 hover:border-gray-700'
    }`}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-2xl font-bold ${color} mt-1`}>{value}</div>
    </div>
  )
  return href ? <Link href={href} title={`Filtrer le plan : ${label}`}>{inner}</Link> : inner
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

function PostRow({ post, client, searchQuery, now, detailHref, planUrl }: { post: Post; client: Client | undefined; searchQuery?: string; now: number; detailHref: string; planUrl: (overrides: Record<string, string | undefined>) => string }) {
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
            {post.pillar && (
              <Link
                href={planUrl({ pillar: post.pillar })}
                title={`Filtrer par pilier : ${post.pillar}`}
                className="text-[10px] border rounded px-1.5 py-0.5 border-violet-700/40 text-violet-300 hover:bg-violet-900/20 transition-colors"
              >
                {post.pillar}
              </Link>
            )}
            {post.contentType && post.contentType !== 'photo' && (
              <Link
                href={planUrl({ type: post.contentType })}
                title={`Filtrer par type : ${CONTENT_TYPE_LABELS[post.contentType] ?? post.contentType}`}
                className="text-[10px] border rounded px-1.5 py-0.5 border-indigo-700/40 text-indigo-300 hover:bg-indigo-900/20 transition-colors"
              >
                {CONTENT_TYPE_LABELS[post.contentType] ?? post.contentType}
              </Link>
            )}
            <span className="text-[11px] text-gray-500 ml-auto">
              {post.publishedAt ? `Publié ${formatRelative(post.publishedAt)}` : `Créé ${formatRelative(post.createdAt)}`}
            </span>
          </div>

          {post.brief && (
            <p className="text-[11px] text-gray-400 line-clamp-1 mb-0.5 italic">
              {post.brief}
            </p>
          )}

          <p className="text-sm text-gray-200 line-clamp-2 leading-snug">
            <HighlightText text={post.caption} query={searchQuery} />
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

          {/* Engagement insights (published posts with data) */}
          {post.status === 'published' && post.metaInsights.length > 0 && (() => {
            const ins = post.metaInsights[0]
            const engRate = ins.reach > 0 ? (((ins.likes ?? 0) + (ins.comments ?? 0) + (ins.shares ?? 0)) / ins.reach * 100).toFixed(1) : null
            return (
              <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-gray-500 bg-gray-900/40 rounded-lg px-3 py-1.5">
                {ins.reach > 0 && <span className="text-gray-400">👁 {ins.reach.toLocaleString('fr-FR')} portée</span>}
                {(ins.likes ?? 0) > 0 && <span>❤️ {ins.likes}</span>}
                {(ins.comments ?? 0) > 0 && <span>💬 {ins.comments}</span>}
                {(ins.shares ?? 0) > 0 && <span>↗ {ins.shares}</span>}
                {engRate && <span className="text-emerald-400 font-medium">{engRate}% engagement</span>}
              </div>
            )
          })()}

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
              <InlineSchedulePicker postId={post.id} status={post.status} scheduledAt={post.scheduledAt} now={now} />
              {post.status !== 'scheduled' && <span className="text-gray-700">{formatTime(post.createdAt)}</span>}
              {post.impactScore > 0 && <span>Impact {post.impactScore}/100</span>}
              {post.cost > 0 && <span>${post.cost.toFixed(4)}</span>}
              {post.status === 'draft' && (
                <MarkReadyButton postId={post.id} />
              )}
              <Link
                href={detailHref}
                title="Voir le détail complet de ce post"
                className="flex items-center gap-1 text-gray-500 hover:text-gray-300 hover:underline"
              >
                Détail
              </Link>
              <Link
                href={`/studio?cloneFrom=${post.id}`}
                title="Réutiliser le brief de ce post comme template dans le Studio"
                className="ml-auto flex items-center gap-1 text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                <Copy className="w-3 h-3" />
                Réutiliser
              </Link>
              <DuplicatePostButton postId={post.id} className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-300 hover:underline transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
