import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  Hash,
  Sparkles,
} from 'lucide-react'
import { getPost } from '@/lib/db/queries/posts'
import { getClient } from '@/lib/db/queries/clients'
import { DeletePostButton } from '@/components/posts/DeletePostButton'
import { PostActions, PostSupervisor } from '@/components/posts/PostActions'
import { PostQuickButton } from '@/components/posts/PostQuickButtons'

export const dynamic = 'force-dynamic'

const PLATFORM_LABEL: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
}

const STATUS_CFG: Record<string, { label: string; icon: typeof Clock; cls: string }> = {
  draft: { label: 'Brouillon', icon: Clock, cls: 'border-amber-700/40 bg-amber-950/20 text-amber-300' },
  ready: { label: 'Prêt', icon: Sparkles, cls: 'border-purple-700/40 bg-purple-950/20 text-purple-300' },
  scheduled: { label: 'Planifié', icon: CalendarDays, cls: 'border-blue-700/40 bg-blue-950/20 text-blue-300' },
  published: { label: 'Publié', icon: CheckCircle2, cls: 'border-emerald-700/40 bg-emerald-950/20 text-emerald-300' },
  failed: { label: 'Échec', icon: AlertCircle, cls: 'border-red-700/40 bg-red-950/20 text-red-300' },
}

type FromContext = 'validation' | 'plan' | 'calendar' | 'dashboard'

const FROM_CFG: Record<FromContext, { label: string; href: string }> = {
  validation: { label: 'Validation', href: '/validation' },
  plan: { label: 'Plan', href: '/plan' },
  calendar: { label: 'Calendrier', href: '/calendar' },
  dashboard: { label: 'Pilotage', href: '/' },
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function PostDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string }>
}) {
  const { id } = await params
  const { from } = await searchParams
  const fromCtx: FromContext = ['validation', 'plan', 'calendar', 'dashboard'].includes(from ?? '')
    ? (from as FromContext)
    : 'validation'

  const post = await getPost(id)
  if (!post) notFound()

  const client = await getClient(post.clientId)
  const status = STATUS_CFG[post.status] ?? STATUS_CFG.draft
  const StatusIcon = status.icon
  const back = FROM_CFG[fromCtx]

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href={back.href} className="inline-flex items-center gap-1 hover:text-gray-300">
          <ArrowLeft className="h-4 w-4" />
          {back.label}
        </Link>
        {client && (
          <>
            <span>/</span>
            <Link href={`/clients/${client.id}`} className="hover:text-gray-300">
              {client.emoji} {client.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-400">{post.id}</span>
      </div>

      <section className="flex flex-col gap-4 border-b border-gray-800 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${status.cls}`}>
            <StatusIcon className="h-3.5 w-3.5" />
            {status.label}
          </div>
          <h1 className="text-2xl font-bold text-white">{post.brief || post.caption.slice(0, 90)}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {post.platforms.map(platform => (
              <Link
                key={platform}
                href={`/plan?platform=${platform}`}
                className="rounded-full border border-gray-800 bg-gray-900 px-2 py-0.5 text-gray-300 hover:border-purple-700"
              >
                {PLATFORM_LABEL[platform] ?? platform}
              </Link>
            ))}
            <span>Créé le {formatDate(post.createdAt)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {post.status === 'draft' && <PostQuickButton postId={post.id} action="mark-ready" />}
          {post.status === 'failed' && <PostQuickButton postId={post.id} action="reset" />}
          <PostQuickButton postId={post.id} action="duplicate" redirectToPost />
          {post.status !== 'published' && <DeletePostButton postId={post.id} />}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <main className="space-y-5">
          {post.imageUrl && (
            <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.imageUrl} alt="Visuel du post" className="max-h-[520px] w-full object-cover" />
            </div>
          )}

          <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                <FileText className="h-4 w-4 text-purple-400" />
                Texte du post
              </h2>
              <span
                title="Nombre de caractères de la caption"
                className={`text-xs font-mono ${post.caption.length > 2200 ? 'text-red-400' : post.caption.length > 2000 ? 'text-amber-400' : 'text-gray-500'}`}
              >
                {post.caption.length} car.
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-200">{post.caption}</p>

            {post.hook && (
              <div className="mt-4 border-t border-gray-800 pt-4">
                <div className="mb-1 text-[10px] uppercase tracking-wider text-gray-500">Hook</div>
                <p className="text-sm text-gray-300">{post.hook}</p>
              </div>
            )}

            {post.cta && (
              <div className="mt-4 border-t border-gray-800 pt-4">
                <div className="mb-1 text-[10px] uppercase tracking-wider text-gray-500">CTA</div>
                <p className="text-sm text-gray-300">{post.cta}</p>
              </div>
            )}
          </section>

          {post.hashtags.length > 0 && (
            <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
              <h2 className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                <Hash className="h-3.5 w-3.5" />
                Hashtags
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {post.hashtags.map(tag => (
                  <span key={tag} className="rounded-full border border-blue-800/30 bg-blue-950/30 px-2 py-0.5 text-xs text-blue-300">
                    #{tag.replace(/^#/, '')}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
            <h2 className="mb-2 text-xs font-semibold text-gray-400">Brief et raisonnement</h2>
            <p className="text-sm leading-relaxed text-gray-300">{post.brief}</p>
            {post.reasoning && (
              <details className="mt-3 text-xs">
                <summary className="cursor-pointer select-none text-purple-300">Voir le raisonnement IA</summary>
                <p className="mt-2 rounded-lg border border-purple-800/20 bg-purple-950/20 p-3 leading-relaxed text-gray-300">
                  {post.reasoning}
                </p>
              </details>
            )}
          </section>

          {post.status === 'failed' && post.error && (
            <section className="flex gap-3 rounded-2xl border border-red-700/30 bg-red-950/20 p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
              <div>
                <div className="text-sm font-medium text-red-300">Erreur de publication</div>
                <p className="mt-1 text-xs text-red-200">{post.error}</p>
              </div>
            </section>
          )}

          {post.portalFeedback && (
            <section className={`rounded-2xl border p-4 ${post.portalFeedback.action === 'approved' ? 'border-emerald-700/30 bg-emerald-950/20' : 'border-amber-700/30 bg-amber-950/20'}`}>
              <div className="text-sm font-semibold text-white">
                {post.portalFeedback.action === 'approved' ? 'Client approuvé' : 'Modifications demandées par le client'}
              </div>
              {post.portalFeedback.comment && (
                <p className="mt-2 text-sm text-gray-300">&quot;{post.portalFeedback.comment}&quot;</p>
              )}
              <p className="mt-2 text-xs text-gray-500">{formatDate(post.portalFeedback.reviewedAt)}</p>
            </section>
          )}
        </main>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
            <h2 className="mb-3 text-xs font-semibold text-gray-400">Actions publication</h2>
            <PostActions post={post} />
          </section>

          <PostSupervisor post={post} />

          <section className="space-y-3 rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
            <h2 className="text-xs font-semibold text-gray-400">Métadonnées</h2>
            <MetaRow label="Impact" value={`${post.impactScore}/100`} />
            {post.impactAnalysis && <MetaBlock label="Analyse impact" value={post.impactAnalysis} />}
            {post.cost > 0 && <MetaRow label="Coût IA" value={`$${post.cost.toFixed(4)}`} icon={DollarSign} />}
            {post.tokensUsed > 0 && <MetaRow label="Tokens" value={post.tokensUsed.toLocaleString('fr-FR')} />}
            {post.scheduledAt && <MetaRow label="Planifié" value={formatDate(post.scheduledAt)} icon={CalendarDays} />}
            {post.publishedAt && <MetaRow label="Publié" value={formatDate(post.publishedAt)} icon={CheckCircle2} />}
            <MetaRow label="Modifié" value={formatDate(post.updatedAt)} />
          </section>

          {Object.keys(post.metaPostIds).length > 0 && (
            <section className="rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
              <h2 className="mb-2 text-xs font-semibold text-gray-400">IDs de publication</h2>
              <div className="space-y-2">
                {Object.entries(post.metaPostIds).map(([platform, metaId]) => (
                  <div key={platform} className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="w-16 text-gray-500">{PLATFORM_LABEL[platform] ?? platform}</span>
                    <code className="min-w-0 flex-1 truncate text-gray-300">{metaId}</code>
                    <ExternalLink className="h-3 w-3 flex-shrink-0 text-gray-600" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {client && (
            <Link
              href={`/clients/${client.id}`}
              className="block rounded-2xl border border-gray-800 bg-gray-900/40 p-4 text-sm text-gray-300 hover:border-purple-700/60"
            >
              Retour fiche client : {client.name}
            </Link>
          )}
        </aside>
      </div>
    </div>
  )
}

function MetaRow({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof DollarSign }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="flex items-center gap-1 text-gray-500">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </span>
      <span className="text-right text-gray-300">{value}</span>
    </div>
  )
}

function MetaBlock({ label, value }: { label: string; value: string }) {
  return (
    <details className="text-xs">
      <summary className="cursor-pointer select-none text-gray-500 hover:text-gray-300">{label}</summary>
      <p className="mt-2 rounded-lg border border-gray-800 bg-gray-950/50 p-2 leading-relaxed text-gray-300">
        {value}
      </p>
    </details>
  )
}
