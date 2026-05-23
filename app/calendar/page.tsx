import Link from 'next/link'
import { CalendarDays, Clock, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import { listPosts } from '@/lib/db/queries/posts'
import { listClients } from '@/lib/db/queries/clients'
import { PublishDueButton } from '@/components/posts/PostActions'
import type { Post } from '@/types/post'
import type { Client } from '@/types/client'

export const dynamic = 'force-dynamic'

const STATUS_INFO: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft:     { label: 'Brouillon', color: 'text-amber-400 border-amber-700/40 bg-amber-950/30',  icon: Clock },
  ready:     { label: 'Prêt',      color: 'text-purple-300 border-purple-700/40 bg-purple-950/30', icon: Sparkles },
  scheduled: { label: 'Planifié',  color: 'text-blue-300 border-blue-700/40 bg-blue-950/30',       icon: CalendarDays },
  published: { label: 'Publié',    color: 'text-emerald-300 border-emerald-700/40 bg-emerald-950/30', icon: CheckCircle2 },
  failed:    { label: 'Échec',     color: 'text-red-300 border-red-700/40 bg-red-950/30',         icon: AlertCircle },
}

export default async function CalendarPage() {
  const [posts, clients] = await Promise.all([listPosts({ limit: 200 }), listClients()])
  const clientsMap = new Map<string, Client>(clients.map(c => [c.id, c]))

  // Sort: scheduled posts first (by date asc), then drafts/ready (newest first), then published (newest first)
  const planned = posts
    .filter(p => p.status === 'scheduled')
    .sort((a, b) => (a.scheduledAt ?? 0) - (b.scheduledAt ?? 0))

  const inProgress = posts
    .filter(p => p.status === 'draft' || p.status === 'ready')
    .sort((a, b) => b.createdAt - a.createdAt)

  const dueSoonCount = planned.filter(p => (p.scheduledAt ?? Infinity) <= Date.now()).length
  const next7d = planned.filter(p => (p.scheduledAt ?? 0) <= Date.now() + 7 * 24 * 3600_000).length

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-purple-400" />
            Calendrier
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Posts prêts, planifiés et dus à publier
          </p>
        </div>
        <PublishDueButton />
      </div>

      <div className="bg-blue-950/20 border border-blue-700/30 rounded-2xl p-4 text-sm text-blue-200">
        <strong className="text-white">Automatisation :</strong> &nbsp;
        Le bouton « Publier les posts dus » traite tous les posts dont la date est passée via
        <code className="mx-1 px-1.5 py-0.5 rounded bg-blue-950 border border-blue-800 text-[11px]">/api/cron/publish-due</code>.
        En production, branche ce même endpoint sur un cron Vercel ou GitHub Actions
        (header <code className="px-1 py-0.5 rounded bg-blue-950 text-[11px]">Authorization: Bearer $CRON_SECRET</code>).
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatBox label="Posts planifiés" value={planned.length} color="text-blue-400" />
        <StatBox label="Dus maintenant" value={dueSoonCount} color="text-red-400" />
        <StatBox label="Prochains 7 jours" value={next7d} color="text-purple-400" />
      </div>

      {/* Planifiés */}
      <Section title="🗓 Planifiés" emptyLabel="Aucun post planifié.">
        {planned.map(p => (
          <TimelineRow key={p.id} post={p} client={clientsMap.get(p.clientId)} />
        ))}
      </Section>

      {/* Brouillons / prêts */}
      <Section title="📝 En préparation" emptyLabel="Aucun brouillon en cours.">
        {inProgress.map(p => (
          <TimelineRow key={p.id} post={p} client={clientsMap.get(p.clientId)} />
        ))}
      </Section>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-2xl font-bold ${color} mt-1`}>{value}</div>
    </div>
  )
}

function Section({ title, emptyLabel, children }: { title: string; emptyLabel: string; children: React.ReactNode }) {
  const hasContent = Array.isArray(children) ? children.length > 0 : Boolean(children)
  return (
    <section className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
      <h2 className="text-sm font-semibold text-white mb-3">{title}</h2>
      {hasContent ? (
        <div className="space-y-2">{children}</div>
      ) : (
        <p className="text-sm text-gray-500 italic">{emptyLabel}</p>
      )}
    </section>
  )
}

function TimelineRow({ post, client }: { post: Post; client: Client | undefined }) {
  const cfg = STATUS_INFO[post.status] ?? STATUS_INFO.draft
  const Icon = cfg.icon
  const when = post.scheduledAt
    ? new Date(post.scheduledAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'non planifié'

  const overdue = post.status === 'scheduled' && post.scheduledAt && post.scheduledAt < Date.now()

  return (
    <Link
      href={`/validation#${post.id}`}
      className="flex items-center gap-3 p-3 rounded-lg bg-gray-950/40 border border-gray-800 hover:border-purple-700/50 transition-colors"
    >
      <Icon className={`w-4 h-4 ${cfg.color.split(' ')[0]} flex-shrink-0`} />
      <span className="text-lg flex-shrink-0">{client?.emoji ?? '◇'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm text-white truncate">{post.brief}</span>
          {overdue && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-900/40 text-red-300 border border-red-700/40">
              en retard
            </span>
          )}
        </div>
        <div className="text-[11px] text-gray-500">
          {client?.name} · {post.platforms.join(' + ')}
        </div>
      </div>
      <div className="text-right text-[11px] text-gray-400 flex-shrink-0">
        <div>{when}</div>
        <span className={`inline-block text-[10px] border rounded-full px-2 py-0.5 mt-1 ${cfg.color}`}>{cfg.label}</span>
      </div>
    </Link>
  )
}
