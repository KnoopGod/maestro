import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarDays, CheckCircle2, AlertCircle, Clock, Sparkles, DollarSign, Hash, FileText, ExternalLink, Copy } from 'lucide-react'
import { getPost } from '@/lib/db/queries/posts'
import { getClient } from '@/lib/db/queries/clients'
import { PostActions, PostSupervisor, PostDeleteButton } from '@/components/posts/PostActions'
import { PostInlineEditor } from '@/components/posts/PostInlineEditor'
import { PostImageSwap } from '@/components/posts/PostImageSwap'
import { CopyCaptionButton } from '@/components/posts/CopyCaptionButton'

export const dynamic = 'force-dynamic'

const PLATFORM_EMOJI: Record<string, string> = {
  instagram: '📷', facebook: '👍', tiktok: '🎵', linkedin: '💼', google_business: '📍',
}

const STATUS_CFG: Record<string, { label: string; icon: typeof Clock; color: string; border: string }> = {
  draft:     { label: 'Brouillon', icon: Clock,         color: 'text-amber-400',   border: 'border-amber-700/40 bg-amber-950/20' },
  ready:     { label: 'Prêt',      icon: Sparkles,      color: 'text-purple-400',  border: 'border-purple-700/40 bg-purple-950/20' },
  scheduled: { label: 'Planifié',  icon: CalendarDays,  color: 'text-blue-400',    border: 'border-blue-700/40 bg-blue-950/20' },
  published: { label: 'Publié',    icon: CheckCircle2,  color: 'text-emerald-400', border: 'border-emerald-700/40 bg-emerald-950/20' },
  failed:    { label: 'Échec',     icon: AlertCircle,   color: 'text-red-400',     border: 'border-red-700/40 bg-red-950/20' },
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await getPost(id)
  if (!post) notFound()

  const client = await getClient(post.clientId)
  const cfg = STATUS_CFG[post.status] ?? STATUS_CFG.draft
  const StatusIcon = cfg.icon

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/validation" title="Retour à la file de validation" className="hover:text-gray-300 transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Validation
        </Link>
        {client && (
          <>
            <span>/</span>
            <Link href={`/clients/${client.id}`} title={`Fiche de ${client.name}`} className="hover:text-gray-300 transition-colors">
              {client.emoji} {client.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-400">{post.id.slice(0, 8)}…</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-gray-800">
        <div>
          <div className={`inline-flex items-center gap-1.5 text-xs border rounded-full px-2.5 py-0.5 mb-2 ${cfg.border} ${cfg.color}`}>
            <StatusIcon className="w-3 h-3" />
            {cfg.label}
          </div>
          <h1 className="text-2xl font-bold text-white line-clamp-2">
            {post.brief || post.caption.substring(0, 80)}
          </h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-gray-500">
            {client && (
              <Link href={`/clients/${client.id}`} className="text-purple-400 hover:underline">
                {client.emoji} {client.name}
              </Link>
            )}
            {post.pillar && <span className="bg-indigo-950/40 border border-indigo-800/40 text-indigo-300 rounded-full px-2 py-0.5">{post.pillar}</span>}
            <span>{post.platforms.map(p => PLATFORM_EMOJI[p] ?? '🌐').join(' ')}</span>
            <span>Créé le {formatDate(post.createdAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href={`/studio?cloneFrom=${post.id}`}
            title="Dupliquer ce post comme point de départ"
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Dupliquer
          </Link>
          <PostDeleteButton post={post} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Image */}
          {post.imageUrl && (
            <div className="rounded-2xl overflow-hidden border border-gray-800">
              <Image
                src={post.imageUrl}
                alt="Image du post"
                width={800}
                height={600}
                className="w-full object-cover max-h-80"
              />
            </div>
          )}

          {/* Caption */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                Caption
              </h2>
              <CopyCaptionButton post={post} />
            </div>
            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{post.caption}</p>

            {post.hook && (
              <div className="mt-3 pt-3 border-t border-gray-800">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Hook</div>
                <p className="text-sm text-gray-300 italic">{post.hook}</p>
              </div>
            )}
            {post.cta && (
              <div className="mt-3 pt-3 border-t border-gray-800">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">CTA</div>
                <p className="text-sm text-gray-300">{post.cta}</p>
              </div>
            )}
          </div>

          {/* Hashtags */}
          {post.hashtags.length > 0 && (
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4">
              <h2 className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 mb-3">
                <Hash className="w-3.5 h-3.5" />
                Hashtags ({post.hashtags.length})
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {post.hashtags.map(h => (
                  <span key={h} className="text-xs bg-blue-950/30 border border-blue-800/30 text-blue-300 rounded-full px-2 py-0.5">
                    #{h.replace(/^#/, '')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Brief */}
          {post.brief && (
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4">
              <div className="text-xs font-semibold text-gray-400 mb-2">Brief original</div>
              <p className="text-sm text-gray-400 leading-relaxed">{post.brief}</p>
            </div>
          )}

          {/* Error */}
          {post.status === 'failed' && post.error && (
            <div className="flex gap-2.5 p-4 bg-red-950/20 border border-red-700/30 rounded-2xl">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-red-300 mb-1">Erreur de publication</div>
                <p className="text-xs text-red-400/80">{post.error}</p>
              </div>
            </div>
          )}

          {/* Portal feedback */}
          {post.portalFeedback && (
            <div className={`p-4 rounded-2xl border flex gap-3 ${
              post.portalFeedback.action === 'approved'
                ? 'bg-emerald-950/20 border-emerald-700/30'
                : 'bg-orange-950/20 border-orange-700/30'
            }`}>
              <span className="text-xl flex-shrink-0">{post.portalFeedback.action === 'approved' ? '✓' : '✎'}</span>
              <div>
                <div className={`text-sm font-semibold ${post.portalFeedback.action === 'approved' ? 'text-emerald-300' : 'text-orange-300'}`}>
                  {post.portalFeedback.action === 'approved' ? 'Client approuvé' : 'Modifications demandées par le client'}
                </div>
                {post.portalFeedback.comment && (
                  <p className="text-sm text-gray-300 mt-1 leading-relaxed">&quot;{post.portalFeedback.comment}&quot;</p>
                )}
                <p className="text-[11px] text-gray-500 mt-1">{formatDate(post.portalFeedback.reviewedAt)}</p>
              </div>
            </div>
          )}

          {/* Inline editor + image swap */}
          <PostInlineEditor post={post} />
          <PostImageSwap post={post} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Actions */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4">
            <h2 className="text-xs font-semibold text-gray-400 mb-3">Actions</h2>
            <PostActions post={post} />
          </div>

          {/* Supervisor review */}
          <PostSupervisor post={post} />

          {/* Meta */}
          <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4 space-y-3">
            <h2 className="text-xs font-semibold text-gray-400">Métadonnées</h2>

            <MetaRow label="Impact score" value={`${post.impactScore}/100`} />
            {post.cost > 0 && (
              <MetaRow label="Coût IA" value={`$${post.cost.toFixed(4)}`} icon={DollarSign} />
            )}
            {post.tokensUsed > 0 && (
              <MetaRow label="Tokens" value={post.tokensUsed.toLocaleString('fr-FR')} />
            )}
            {post.scheduledAt && (
              <MetaRow label="Planifié" value={formatDate(post.scheduledAt)} icon={CalendarDays} />
            )}
            {post.publishedAt && (
              <MetaRow label="Publié" value={formatDate(post.publishedAt)} icon={CheckCircle2} />
            )}
            <MetaRow label="Créé" value={formatDate(post.createdAt)} />
            <MetaRow label="Modifié" value={formatDate(post.updatedAt)} />
          </div>

          {/* Meta post IDs */}
          {Object.keys(post.metaPostIds).length > 0 && (
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4">
              <h2 className="text-xs font-semibold text-gray-400 mb-2">IDs Meta</h2>
              {Object.entries(post.metaPostIds).map(([platform, metaId]) => (
                <div key={platform} className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                  <span>{PLATFORM_EMOJI[platform] ?? '🌐'}</span>
                  <code className="font-mono text-gray-300 truncate">{metaId}</code>
                  <ExternalLink className="w-3 h-3 text-gray-600 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* Quick links */}
          <div className="space-y-1.5">
            {client && (
              <Link href={`/clients/${client.id}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-gray-800/40">
                <span>{client.emoji}</span> Fiche {client.name}
              </Link>
            )}
            <Link href={`/plan?client=${post.clientId}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-gray-800/40">
              <CalendarDays className="w-3.5 h-3.5" /> Plan client
            </Link>
            <Link href={`/studio?cloneFrom=${post.id}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition-colors p-2 rounded-lg hover:bg-gray-800/40">
              <Copy className="w-3.5 h-3.5" /> Dupliquer dans le Studio
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetaRow({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof DollarSign }) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="text-gray-500 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </span>
      <span className="text-gray-300 text-right">{value}</span>
    </div>
  )
}
