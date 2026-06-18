import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck, AlertCircle, Sparkles, X } from 'lucide-react'
import { MarkReadyButton } from '@/components/posts/MarkReadyButton'
import { MarkAllReadyButton } from '@/components/posts/MarkAllReadyButton'
import { listPosts } from '@/lib/db/queries/posts'
import { listClients } from '@/lib/db/queries/clients'
import { PostActions, PostSupervisor, PostDeleteButton } from '@/components/posts/PostActions'
import { PostInlineEditor } from '@/components/posts/PostInlineEditor'
import { PostImageSwap } from '@/components/posts/PostImageSwap'
import { BulkSelectionProvider, PostSelectCheckbox, BulkActionBar } from '@/components/posts/BulkActions'
import { CopyCaptionButton } from '@/components/posts/CopyCaptionButton'
import { PlanSearchInput } from '@/components/plan/PlanSearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Post } from '@/types/post'
import type { Client } from '@/types/client'

export const dynamic = 'force-dynamic'

const POST_STATUS_BORDER: Record<string, string> = {
  draft:    'border-l-amber-500/70',
  ready:    'border-l-purple-500/70',
  failed:   'border-l-red-500/70',
  published: 'border-l-emerald-500/70',
}

type SortOption = 'newest' | 'oldest' | 'impact'

function buildUrl(params: Record<string, string | undefined>) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v) p.set(k, v)
  }
  const qs = p.toString()
  return `/validation${qs ? `?${qs}` : ''}`
}

// Helper used inside the async page function — defined here to avoid closure issues
function makeValidationUrl(base: { client?: string; sort?: string; q?: string; status?: string }, overrides: Record<string, string | undefined>) {
  return buildUrl({ ...base, ...overrides })
}

export default async function ValidationPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; sort?: string; q?: string; status?: string }>
}) {
  const { client: clientFilter, sort: sortParam, q: searchQuery, status: statusFilter } = await searchParams
  const validStatuses = ['draft', 'ready', 'failed'] as const
  type ValidationStatus = typeof validStatuses[number]
  const statusF: ValidationStatus | undefined = validStatuses.includes(statusFilter as ValidationStatus) ? statusFilter as ValidationStatus : undefined

  const sortOption: SortOption = sortParam === 'oldest' ? 'oldest' : sortParam === 'impact' ? 'impact' : 'newest'

  const orderBy = sortOption === 'impact' ? 'impact_score' as const : 'created_at' as const
  const orderDir = sortOption === 'oldest' ? 'ASC' as const : 'DESC' as const

  const [queue, clients] = await Promise.all([
    listPosts({
      ...(statusF ? { status: statusF } : { statuses: ['draft', 'ready', 'failed'] }),
      clientId: clientFilter,
      q: searchQuery,
      orderBy,
      orderDir,
      limit: 200,
      includeInsights: false,
    }),
    listClients(),
  ])

  const clientsMap = new Map<string, Client>(clients.map(c => [c.id, c]))

  // Unfiltered counts for chips and stat boxes
  const baseQueue = (clientFilter || statusF)
    ? await listPosts({ statuses: ['draft', 'ready', 'failed'], limit: 200, includeInsights: false })
    : queue
  const clientsInQueue = clients.filter(c => baseQueue.some(p => p.clientId === c.id))
  const countByClient = baseQueue.reduce<Record<string, number>>((acc, p) => {
    acc[p.clientId] = (acc[p.clientId] ?? 0) + 1
    return acc
  }, {})

  const draftCount = baseQueue.filter(p => p.status === 'draft').length
  const readyCount = baseQueue.filter(p => p.status === 'ready').length
  const failedCount = baseQueue.filter(p => p.status === 'failed').length

  const sortLabels: Record<SortOption, string> = { newest: 'Récent', oldest: 'Ancien', impact: 'Impact ↓' }

  const activeValidationParams = new URLSearchParams()
  if (clientFilter) activeValidationParams.set('client', clientFilter)
  if (statusF) activeValidationParams.set('status', statusF)
  if (searchQuery) activeValidationParams.set('q', searchQuery)
  if (sortOption !== 'newest') activeValidationParams.set('sort', sortOption)
  const activeValidationStr = activeValidationParams.toString()
  const sortOptions: SortOption[] = ['newest', 'oldest', 'impact']

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-purple-400" />
            Validation
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            File des posts à relire avant publication ou planification
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MarkAllReadyButton draftIds={queue.filter(p => p.status === 'draft').map(p => p.id)} />
          <Link
            href="/studio"
            title="Créer un nouveau post à ajouter dans la file de validation"
            className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Nouveau post
          </Link>
        </div>
      </div>

      <div className="bg-purple-950/20 border border-purple-700/30 rounded-2xl p-4 text-sm text-purple-200">
        <strong className="text-white">Règle MVP :</strong>{' '}aucun post ne part automatiquement.
        Tu valides le texte, l&apos;image, le timing et la cohérence DA avant de planifier ou publier.
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatBox label="Brouillons" value={draftCount} color="text-amber-400" border="border-amber-800/30"
          href={makeValidationUrl({ client: clientFilter, sort: sortParam, q: searchQuery }, { status: statusF === 'draft' ? undefined : 'draft' })}
          active={statusF === 'draft'} />
        <StatBox label="Prêts" value={readyCount} color="text-purple-400" border="border-purple-800/30"
          href={makeValidationUrl({ client: clientFilter, sort: sortParam, q: searchQuery }, { status: statusF === 'ready' ? undefined : 'ready' })}
          active={statusF === 'ready'} />
        <StatBox label="Échecs" value={failedCount} color="text-red-400" border="border-red-800/30"
          href={makeValidationUrl({ client: clientFilter, sort: sortParam, q: searchQuery }, { status: statusF === 'failed' ? undefined : 'failed' })}
          active={statusF === 'failed'} />
      </div>

      {/* Filters & Sort */}
      <div className="space-y-2">
        {clientsInQueue.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Client filter */}
            <div className="flex flex-wrap items-center gap-1.5 mr-2">
              <span className="text-[10px] uppercase tracking-wider text-gray-500">Client</span>
              <Link
                href={buildUrl({ sort: sortParam, q: searchQuery })}
                title="Afficher tous les clients"
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  !clientFilter
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                Tous
              </Link>
              {clientsInQueue.map(c => (
                <Link
                  key={c.id}
                  href={buildUrl({ client: c.id, sort: sortParam, q: searchQuery })}
                  title={`Filtrer par ${c.name} (${countByClient[c.id] ?? 0} posts)`}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    clientFilter === c.id
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {c.emoji} {c.name} ({countByClient[c.id] ?? 0})
                </Link>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[10px] uppercase tracking-wider text-gray-500">Trier</span>
              {sortOptions.map(s => (
                <Link
                  key={s}
                  href={buildUrl({ client: clientFilter, sort: s === 'newest' ? undefined : s, q: searchQuery })}
                  title={`Trier par ${sortLabels[s]}`}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    sortOption === s
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  {sortLabels[s]}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="flex items-center gap-3">
          <PlanSearchInput initialQ={searchQuery} basePath="/validation" />
          {searchQuery && (
            <p className="text-[11px] text-gray-500">
              {queue.length} résultat{queue.length !== 1 ? 's' : ''} pour <span className="text-purple-300">&ldquo;{searchQuery}&rdquo;</span>
            </p>
          )}
        </div>
      </div>

      {/* Active filter summary */}
      {clientFilter && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>Filtre actif :</span>
          <span className="font-medium text-purple-300">
            {clientsMap.get(clientFilter)?.name ?? clientFilter}
          </span>
          <span>· {queue.length} post{queue.length > 1 ? 's' : ''}</span>
          <Link href={buildUrl({ sort: sortParam, q: searchQuery })} title="Supprimer le filtre client" className="ml-1 text-gray-600 hover:text-gray-400 transition-colors">
            <X className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {queue.length === 0 ? (
        (clientFilter || statusF || searchQuery) ? (
          <EmptyState
            icon={ShieldCheck}
            title="Aucun post ne correspond à ces filtres"
            description="Essaie de modifier ou supprimer les filtres actifs."
            cta={{ label: 'Effacer les filtres', href: '/validation', icon: X }}
          />
        ) : (
          <EmptyState
            icon={ShieldCheck}
            title="Aucun post en attente de validation"
            description="Les posts générés dans le Studio apparaîtront ici pour relecture avant publication."
            cta={{ label: 'Créer un post', href: '/studio', icon: Sparkles }}
          />
        )
      ) : (
        <BulkSelectionProvider>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {queue.map((post, i) => (
              <PostCard
                key={post.id}
                post={post}
                client={clientsMap.get(post.clientId)}
                prevId={queue[i - 1]?.id}
                nextId={queue[i + 1]?.id}
                activeValidationStr={activeValidationStr}
              />
            ))}
          </div>
          <BulkActionBar postStatuses={Object.fromEntries(queue.map(p => [p.id, p.status]))} />
        </BulkSelectionProvider>
      )}
    </div>
  )
}

function StatBox({ label, value, color, border, href, active }: { label: string; value: number; color: string; border: string; href?: string; active?: boolean }) {
  const inner = (
    <div title={`Filtrer : ${label}`} className={`bg-gray-900/40 border ${active ? 'border-purple-700/60 bg-purple-950/10' : border} rounded-xl p-4 transition-all hover:-translate-y-0.5 duration-200`}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-2xl font-bold ${color} mt-1`}>{value}</div>
    </div>
  )
  return href ? <Link href={href} title={`Filtrer la validation : ${label}`}>{inner}</Link> : inner
}

function PostCard({ post, client, prevId, nextId, activeValidationStr }: { post: Post; client: Client | undefined; prevId?: string; nextId?: string; activeValidationStr?: string }) {
  const leftBorder = POST_STATUS_BORDER[post.status] ?? ''
  return (
    <article className={`bg-gray-900/40 border border-l-2 ${leftBorder} border-gray-800 rounded-2xl p-5 space-y-4 transition-colors duration-200`}>
      <div className="flex items-start gap-3">
        <PostSelectCheckbox postId={post.id} />
        {post.imageUrl ? (
          <Image src={post.imageUrl} alt="" width={80} height={80} className="rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className={`w-20 h-20 rounded-lg bg-gradient-to-br ${client?.color ?? 'from-gray-700 to-gray-900'} flex items-center justify-center text-2xl flex-shrink-0`}>
            {client?.emoji ?? '📝'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {client && (
              <Link href={`/clients/${client.id}`} className="text-xs text-purple-300 hover:underline">
                {client.emoji} {client.name}
              </Link>
            )}
            <StatusPill status={post.status} />
            {post.pillar && (
              <span className="text-[10px] bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 rounded-full px-2 py-0.5 truncate max-w-[100px]">
                {post.pillar}
              </span>
            )}
            <span className="text-[10px] text-gray-600 ml-auto">Impact {post.impactScore}/100</span>
          </div>
          <p className="text-sm font-medium text-white line-clamp-2">{post.brief}</p>
        </div>
      </div>

      <p className="text-sm text-gray-300 line-clamp-4 leading-snug">{post.caption}</p>

      {post.hashtags.length > 0 && (
        <p className="text-[11px] text-blue-400 line-clamp-1">
          {post.hashtags.slice(0, 6).map(h => `#${h.replace(/^#/, '')}`).join(' ')}
        </p>
      )}

      {post.status === 'failed' && post.error && (
        <div className="text-xs text-red-300 bg-red-950/30 border border-red-700/30 rounded-lg p-2 flex gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{post.error}</span>
        </div>
      )}

      {post.portalFeedback && (
        <div className={`text-xs rounded-lg p-2.5 border flex gap-1.5 ${
          post.portalFeedback.action === 'approved'
            ? 'text-emerald-300 bg-emerald-950/20 border-emerald-700/30'
            : 'text-orange-300 bg-orange-950/20 border-orange-700/30'
        }`}>
          <span className="flex-shrink-0">{post.portalFeedback.action === 'approved' ? '✓' : '✎'}</span>
          <div>
            <span className="font-medium">{post.portalFeedback.action === 'approved' ? 'Client approuvé' : 'Modifications demandées'}</span>
            {post.portalFeedback.comment && <p className="mt-0.5 text-[11px] opacity-80">{post.portalFeedback.comment}</p>}
            <p className="text-[10px] opacity-50 mt-0.5">{new Date(post.portalFeedback.reviewedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      )}

      <PostSupervisor post={post} />
      <PostImageSwap post={post} />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <PostDeleteButton post={post} />
          <CopyCaptionButton post={post} />
          {post.status === 'draft' && <MarkReadyButton postId={post.id} />}
          <Link
            href={`/posts/${post.id}?from=validation${prevId ? `&prevId=${prevId}` : ''}${nextId ? `&nextId=${nextId}` : ''}${activeValidationStr ? '&validationBack=' + encodeURIComponent(activeValidationStr) : ''}`}
            title="Voir le détail complet de ce post"
            className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors px-2 py-1 rounded border border-gray-800 hover:border-gray-700"
          >
            Détail
          </Link>
        </div>
        <PostInlineEditor post={post} />
      </div>
      <PostActions post={post} />
    </article>
  )
}

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  draft:    { label: 'Brouillon', cls: 'text-amber-300 border-amber-700/40 bg-amber-950/20' },
  ready:    { label: 'Prêt',      cls: 'text-purple-300 border-purple-700/40 bg-purple-950/20' },
  failed:   { label: 'Échec',     cls: 'text-red-300 border-red-700/40 bg-red-950/20' },
  published:{ label: 'Publié',    cls: 'text-emerald-300 border-emerald-700/40 bg-emerald-950/20' },
}

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_PILL[status] ?? { label: status, cls: 'text-gray-400 border-gray-700 bg-gray-800/20' }
  return (
    <span title={`Statut du post : ${cfg.label}`} className={`text-[10px] border rounded-full px-2 py-0.5 ${cfg.cls}`}>{cfg.label}</span>
  )
}
