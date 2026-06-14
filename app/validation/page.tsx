import Image from 'next/image'
import Link from 'next/link'
import { ShieldCheck, AlertCircle, Sparkles } from 'lucide-react'
import { listPosts } from '@/lib/db/queries/posts'
import { listClients } from '@/lib/db/queries/clients'
import { PostActions, PostSupervisor, PostDeleteButton } from '@/components/posts/PostActions'
import { PostInlineEditor } from '@/components/posts/PostInlineEditor'
import { PostImageSwap } from '@/components/posts/PostImageSwap'
import { BulkSelectionProvider, PostSelectCheckbox, BulkActionBar } from '@/components/posts/BulkActions'
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

export default async function ValidationPage() {
  const [queue, clients] = await Promise.all([
    listPosts({ statuses: ['draft', 'ready', 'failed'], limit: 200, includeInsights: false }),
    listClients(),
  ])

  const clientsMap = new Map<string, Client>(clients.map(c => [c.id, c]))

  const draftCount = queue.filter(p => p.status === 'draft').length
  const readyCount = queue.filter(p => p.status === 'ready').length
  const failedCount = queue.filter(p => p.status === 'failed').length

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
        <Link
          href="/studio"
          title="Créer un nouveau post à ajouter dans la file de validation"
          className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium flex items-center gap-1.5 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Nouveau post
        </Link>
      </div>

      <div className="bg-purple-950/20 border border-purple-700/30 rounded-2xl p-4 text-sm text-purple-200">
        <strong className="text-white">Règle MVP :</strong>{' '}aucun post ne part automatiquement.
        Tu valides le texte, l&apos;image, le timing et la cohérence DA avant de planifier ou publier.
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatBox label="Brouillons" value={draftCount} color="text-amber-400" border="border-amber-800/30" />
        <StatBox label="Prêts" value={readyCount} color="text-purple-400" border="border-purple-800/30" />
        <StatBox label="Échecs" value={failedCount} color="text-red-400" border="border-red-800/30" />
      </div>

      {queue.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Aucun post en attente de validation"
          description="Les posts générés dans le Studio apparaîtront ici pour relecture avant publication."
          cta={{ label: 'Créer un post', href: '/studio', icon: Sparkles }}
        />
      ) : (
        <BulkSelectionProvider>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {queue.map(post => (
              <PostCard key={post.id} post={post} client={clientsMap.get(post.clientId)} />
            ))}
          </div>
          <BulkActionBar postStatuses={Object.fromEntries(queue.map(p => [p.id, p.status]))} />
        </BulkSelectionProvider>
      )}
    </div>
  )
}

function StatBox({ label, value, color, border }: { label: string; value: number; color: string; border: string }) {
  return (
    <div title={`${label} dans la file de validation`} className={`bg-gray-900/40 border ${border} rounded-xl p-4 hover:-translate-y-0.5 transition-transform duration-200`}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-2xl font-bold ${color} mt-1`}>{value}</div>
    </div>
  )
}

function PostCard({ post, client }: { post: Post; client: Client | undefined }) {
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
        <PostDeleteButton post={post} />
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
