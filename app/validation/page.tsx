import Link from 'next/link'
import { ShieldCheck, AlertCircle, Sparkles, Edit3, ShieldAlert, ShieldX, HelpCircle } from 'lucide-react'
import { listPosts } from '@/lib/db/queries/posts'
import { listClients } from '@/lib/db/queries/clients'
import { PostActions, PostSupervisor } from '@/components/posts/PostActions'
import { PublishErrorHint } from '@/components/posts/PublishErrorHint'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Post } from '@/types/post'
import type { Client } from '@/types/client'

export const dynamic = 'force-dynamic'

type SupervisorFilter = 'all' | 'blocked' | 'revise' | 'unsupervised'

const SUPERVISOR_TABS: { key: SupervisorFilter; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'all',          label: 'Tous',           icon: ShieldCheck,  color: 'text-gray-400'   },
  { key: 'blocked',      label: 'Bloqués',        icon: ShieldX,      color: 'text-red-400'    },
  { key: 'revise',       label: 'À réviser',      icon: ShieldAlert,  color: 'text-amber-400'  },
  { key: 'unsupervised', label: 'Non supervisés', icon: HelpCircle,   color: 'text-gray-500'   },
]

const POST_STATUS_BORDER: Record<string, string> = {
  draft:     'border-l-amber-500/70',
  ready:     'border-l-emerald-500/70',
  failed:    'border-l-red-500/70',
  published: 'border-l-purple-500/70',
}

function matchesSupervisorFilter(post: Post, filter: SupervisorFilter): boolean {
  if (filter === 'all') return true
  if (filter === 'unsupervised') return !post.supervisorReview
  return post.supervisorReview?.verdict === filter
}

export default async function ValidationPage({
  searchParams,
}: {
  searchParams: Promise<{ supervisor?: string }>
}) {
  const { supervisor: supervisorParam } = await searchParams
  const supervisorFilter: SupervisorFilter =
    (['all', 'blocked', 'revise', 'unsupervised'] as SupervisorFilter[]).includes(supervisorParam as SupervisorFilter)
      ? (supervisorParam as SupervisorFilter)
      : 'all'

  const [queue, clients] = await Promise.all([
    listPosts({ statuses: ['draft', 'ready', 'failed'], limit: 200, includeInsights: false }),
    listClients(),
  ])

  const clientsMap = new Map<string, Client>(clients.map(c => [c.id, c]))
  const filtered = queue.filter(p => matchesSupervisorFilter(p, supervisorFilter))

  const draftCount = queue.filter(p => p.status === 'draft').length
  const readyCount = queue.filter(p => p.status === 'ready').length
  const failedCount = queue.filter(p => p.status === 'failed').length
  const blockedCount = queue.filter(p => p.supervisorReview?.verdict === 'blocked').length
  const reviseCount = queue.filter(p => p.supervisorReview?.verdict === 'revise').length
  const unsupervisedCount = queue.filter(p => !p.supervisorReview).length

  const tabCounts: Record<SupervisorFilter, number> = {
    all: queue.length,
    blocked: blockedCount,
    revise: reviseCount,
    unsupervised: unsupervisedCount,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-purple-400" />
            Validation
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            File des posts à relire avant publication ou planification
          </p>
        </div>
        <Link
          href="/studio"
          title="Créer un nouveau post à ajouter dans la file de validation"
          className="group px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 active:scale-[0.98] text-white text-sm font-medium flex items-center gap-2 transition-all duration-150 shadow-lg shadow-purple-900/30"
        >
          <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform duration-150" />
          Nouveau post
        </Link>
      </div>

      {/* Status counters */}
      <div className="grid grid-cols-3 gap-3">
        <StatBox label="Brouillons" value={draftCount}  color="text-amber-400"   border="border-amber-800/40"   bg="bg-amber-900/10" />
        <StatBox label="Prêts"      value={readyCount}  color="text-emerald-400" border="border-emerald-800/40" bg="bg-emerald-900/10" />
        <StatBox label="Échecs"     value={failedCount} color="text-red-400"     border="border-red-800/40"     bg="bg-red-900/10" />
      </div>

      {/* Supervisor filter tabs */}
      {queue.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-gray-800 pb-4">
          <span className="text-[11px] text-gray-600 font-mono self-center mr-1 uppercase tracking-wider">Supervisor :</span>
          {SUPERVISOR_TABS.map(tab => {
            const active = supervisorFilter === tab.key
            const count = tabCounts[tab.key]
            const Icon = tab.icon
            return (
              <Link
                key={tab.key}
                href={tab.key === 'all' ? '/validation' : `/validation?supervisor=${tab.key}`}
                title={`Filtrer par verdict supervisor : ${tab.label}`}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium border transition-all duration-150 ${
                  active
                    ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-900/30'
                    : `border-gray-800 bg-gray-900/60 ${tab.color} hover:bg-gray-800 hover:border-gray-700`
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {count > 0 && (
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-mono ${active ? 'bg-white/20 text-white' : 'bg-gray-800 text-gray-400'}`}>
                    {count}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        queue.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Aucun post en attente de validation"
            description="Les posts générés dans le Studio apparaîtront ici pour relecture avant publication."
            cta={{ label: 'Créer un post', href: '/studio', icon: Sparkles }}
          />
        ) : (
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-12 text-center">
            <ShieldCheck className="w-10 h-10 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 font-medium text-sm">Aucun post avec ce filtre supervisor.</p>
            <p className="text-gray-600 text-xs mt-1">Essayez un autre filtre ou revenez à la vue complète.</p>
            <Link href="/validation" className="inline-flex items-center gap-1.5 mt-4 text-sm text-purple-400 hover:text-purple-300 transition-colors">
              Voir tous les posts
            </Link>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(post => (
            <PostCard key={post.id} post={post} client={clientsMap.get(post.clientId)} />
          ))}
        </div>
      )}
    </div>
  )
}

function StatBox({ label, value, color, border, bg }: { label: string; value: number; color: string; border: string; bg: string }) {
  return (
    <div title={`${label} dans la file de validation`} className={`${bg} border ${border} rounded-xl p-4 hover:-translate-y-0.5 transition-transform duration-200`}>
      <div className="text-xs text-gray-500 font-medium">{label}</div>
      <div className={`text-2xl font-bold ${color} mt-1.5`}>{value}</div>
    </div>
  )
}

function PostCard({ post, client }: { post: Post; client: Client | undefined }) {
  const leftBorder = POST_STATUS_BORDER[post.status] ?? ''
  return (
    <article id={post.id} className={`bg-gray-900/40 border border-l-4 ${leftBorder} border-gray-800 rounded-2xl p-5 space-y-4 hover:border-gray-700 hover:shadow-[0_0_20px_rgba(99,102,241,0.06)] transition-all duration-200`}>
      {/* Top: image + meta */}
      <div className="flex items-start gap-3">
        {post.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.imageUrl} alt="" loading="lazy" decoding="async" className="w-20 h-20 rounded-xl object-cover flex-shrink-0 ring-1 ring-gray-700" />
        ) : (
          <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${client?.color ?? 'from-gray-700 to-gray-900'} flex items-center justify-center text-2xl flex-shrink-0 ring-1 ring-gray-700`}>
            {client?.emoji ?? '📝'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {client && (
              <Link href={`/clients/${client.id}`} className="text-xs text-purple-300 hover:text-purple-200 transition-colors font-medium">
                {client.emoji} {client.name}
              </Link>
            )}
            <StatusPill status={post.status} />
            {post.supervisorReview && <SupervisorPill verdict={post.supervisorReview.verdict} score={post.supervisorReview.score} />}
            <span className="text-xs text-gray-500 ml-auto">Impact <span className="text-gray-300 font-medium">{post.impactScore}</span>/100</span>
          </div>
          <p className="text-sm font-semibold text-[#E0E3FF] line-clamp-2 leading-snug">{post.brief}</p>
        </div>
      </div>

      {/* Caption */}
      <p className="text-sm text-gray-300 line-clamp-4 leading-relaxed">{post.caption}</p>

      {/* Hashtags */}
      {post.hashtags.length > 0 && (
        <p className="text-[11px] text-blue-400/80 line-clamp-1 font-mono">
          {post.hashtags.slice(0, 6).map(h => `#${h.replace(/^#/, '')}`).join(' ')}
        </p>
      )}

      {/* Error block */}
      {post.status === 'failed' && post.error && (
        <>
          <div className="text-xs text-red-300 bg-red-950/30 border border-red-700/30 rounded-lg p-3 flex gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{post.error}</span>
          </div>
          <PublishErrorHint error={post.error} clientId={post.clientId} />
        </>
      )}

      <PostSupervisor post={post} />

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-800/60">
        <Link
          href={`/studio?postId=${post.id}`}
          title="Ouvrir ce draft dans le Studio pour modifier le brief, le texte ou le visuel avant publication"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-800 hover:border-gray-600 text-sm transition-all duration-150"
        >
          <Edit3 className="w-3.5 h-3.5" />
          Modifier dans Studio
        </Link>
      </div>
      <PostActions post={post} />
    </article>
  )
}

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  draft:    { label: 'Brouillon', cls: 'text-amber-300 border-amber-700/40 bg-amber-950/20' },
  ready:    { label: 'Prêt',      cls: 'text-emerald-300 border-emerald-800/40 bg-emerald-950/20' },
  failed:   { label: 'Échec',     cls: 'text-red-300 border-red-700/40 bg-red-950/20' },
  published:{ label: 'Publié',    cls: 'text-purple-300 border-purple-700/40 bg-purple-950/20' },
}

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_PILL[status] ?? { label: status, cls: 'text-gray-400 border-gray-700 bg-gray-800/20' }
  return (
    <span title={`Statut du post : ${cfg.label}`} className={`text-[11px] border rounded-full px-2 py-0.5 font-medium ${cfg.cls}`}>{cfg.label}</span>
  )
}

const VERDICT_PILL: Record<string, { label: string; cls: string }> = {
  ready:   { label: '✓ Approuvé',   cls: 'text-emerald-300 border-emerald-700/40 bg-emerald-950/20' },
  revise:  { label: '⚠ À réviser',  cls: 'text-amber-300 border-amber-700/40 bg-amber-950/20' },
  blocked: { label: '✕ Bloqué',     cls: 'text-red-300 border-red-700/40 bg-red-950/20' },
}

function SupervisorPill({ verdict, score }: { verdict: string; score: number }) {
  const cfg = VERDICT_PILL[verdict]
  if (!cfg) return null
  return (
    <span title={`Verdict supervisor : ${verdict} (${score}/100)`} className={`text-[11px] border rounded-full px-2 py-0.5 font-medium ${cfg.cls}`}>
      {cfg.label} · {score}/100
    </span>
  )
}
