import Link from 'next/link'
import { CalendarDays, Clock, CheckCircle2, AlertCircle, Sparkles, Plus } from 'lucide-react'
import { listPosts } from '@/lib/db/queries/posts'
import { listClientsWithStats } from '@/lib/db/queries/clients'
import { PublishDueButton } from '@/components/posts/PostActions'
import type { Post } from '@/types/post'
import type { ClientWithStats } from '@/types/client'

export const dynamic = 'force-dynamic'

const STATUS_INFO: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft:     { label: 'Brouillon', color: 'text-amber-400 border-amber-700/40 bg-amber-950/30',  icon: Clock },
  ready:     { label: 'Prêt',      color: 'text-purple-300 border-purple-700/40 bg-purple-950/30', icon: Sparkles },
  scheduled: { label: 'Planifié',  color: 'text-blue-300 border-blue-700/40 bg-blue-950/30',       icon: CalendarDays },
  published: { label: 'Publié',    color: 'text-emerald-300 border-emerald-700/40 bg-emerald-950/30', icon: CheckCircle2 },
  failed:    { label: 'Échec',     color: 'text-red-300 border-red-700/40 bg-red-950/30',         icon: AlertCircle },
}

export default async function CalendarPage() {
  // Toutes les statuses : la vue semaine affiche aussi les posts publiés
  const [posts, clients] = await Promise.all([
    listPosts({ limit: 200, includeInsights: false }),
    listClientsWithStats(),
  ])
  const clientsMap = new Map<string, ClientWithStats>(clients.map(c => [c.id, c]))

  // Sort: scheduled posts first (by date asc), then drafts/ready (newest first), then published (newest first)
  const planned = posts
    .filter(p => p.status === 'scheduled')
    .sort((a, b) => (a.scheduledAt ?? 0) - (b.scheduledAt ?? 0))

  const inProgress = posts
    .filter(p => p.status === 'draft' || p.status === 'ready')
    .sort((a, b) => b.createdAt - a.createdAt)

  const now = new Date().getTime()
  const dueSoonCount = planned.filter(p => (p.scheduledAt ?? Infinity) <= now).length
  const next7d = planned.filter(p => (p.scheduledAt ?? 0) <= now + 7 * 24 * 3600_000).length

  // ─── Weekly grid ────────────────────────────────────────────────────────────
  const today = new Date()
  // Monday of current week
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  weekStart.setHours(0, 0, 0, 0)
  const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  // Map: clientId → Set of day indices (0=Mon…6=Sun) with post status
  type DayStatus = 'published' | 'scheduled' | 'draft'
  const clientDayMap = new Map<string, Map<number, DayStatus>>()
  for (const p of posts) {
    const at = p.publishedAt ?? p.scheduledAt ?? p.createdAt
    const d = new Date(at)
    const dayMs = d.setHours(0, 0, 0, 0)
    const dayIndex = Math.floor((dayMs - weekStart.getTime()) / 86_400_000)
    if (dayIndex < 0 || dayIndex > 6) continue
    if (!clientDayMap.has(p.clientId)) clientDayMap.set(p.clientId, new Map())
    const current = clientDayMap.get(p.clientId)!.get(dayIndex)
    const priority: DayStatus[] = ['published', 'scheduled', 'draft']
    const status: DayStatus = p.status === 'published' ? 'published' : p.status === 'scheduled' ? 'scheduled' : 'draft'
    if (!current || priority.indexOf(status) < priority.indexOf(current)) {
      clientDayMap.get(p.clientId)!.set(dayIndex, status)
    }
  }

  const activeClients = clients.filter(c => c.status === 'active')
  const todayIndex = (today.getDay() + 6) % 7

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

      {/* Weekly grid */}
      {activeClients.length > 0 && (
        <section className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-400" />
              Vue semaine
            </h2>
            <span className="text-[10px] text-gray-500 font-mono">
              {weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – {weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-4 py-2 text-[10px] text-gray-600 font-mono w-36">CLIENT</th>
                  {weekDays.map((d, i) => (
                    <th key={i} className={`text-center py-2 px-2 text-[10px] font-mono w-12 ${i === todayIndex ? 'text-indigo-400' : 'text-gray-600'}`}>
                      <div>{DAYS_FR[i]}</div>
                      <div className={`text-[9px] mt-0.5 ${i === todayIndex ? 'text-indigo-300' : 'text-gray-700'}`}>{d.getDate()}</div>
                    </th>
                  ))}
                  <th className="px-3 py-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {activeClients.map((c, idx) => {
                  const dayMap = clientDayMap.get(c.id) ?? new Map()
                  return (
                    <tr key={c.id} className={`border-b border-gray-800/50 ${idx % 2 === 1 ? 'bg-gray-900/20' : ''}`}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{c.emoji}</span>
                          <span className="text-[11px] text-gray-300 truncate max-w-[90px]">{c.name}</span>
                        </div>
                      </td>
                      {weekDays.map((_, i) => {
                        const status = dayMap.get(i)
                        return (
                          <td key={i} className={`text-center py-2.5 px-2 ${i === todayIndex ? 'bg-indigo-950/20' : ''}`}>
                            {status === 'published' && (
                              <span title="Publié" className="inline-block w-3 h-3 rounded-full bg-emerald-500 mx-auto" />
                            )}
                            {status === 'scheduled' && (
                              <span title="Planifié" className="inline-block w-3 h-3 rounded-full bg-blue-400 mx-auto" />
                            )}
                            {status === 'draft' && (
                              <span title="Brouillon" className="inline-block w-3 h-3 rounded-full bg-amber-400/60 mx-auto" />
                            )}
                            {!status && (
                              <span className="inline-block w-2 h-px bg-gray-800 mx-auto" />
                            )}
                          </td>
                        )
                      })}
                      <td className="pr-3 py-2.5">
                        <Link
                          href={`/studio?client=${c.id}`}
                          className="text-gray-700 hover:text-indigo-400 transition-colors"
                          title="Créer un post"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-2.5 border-t border-gray-800 flex items-center gap-4 text-[9px] text-gray-600 font-mono">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Publié</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />Planifié</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400/60 inline-block" />Brouillon</span>
          </div>
        </section>
      )}

      {/* Planifiés */}
      <Section title="🗓 Planifiés" emptyLabel="Aucun post planifié.">
        {planned.map(p => (
          <TimelineRow key={p.id} post={p} client={clientsMap.get(p.clientId)} now={now} />
        ))}
      </Section>

      {/* Brouillons / prêts */}
      <Section title="📝 En préparation" emptyLabel="Aucun brouillon en cours.">
        {inProgress.map(p => (
          <TimelineRow key={p.id} post={p} client={clientsMap.get(p.clientId)} now={now} />
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

function TimelineRow({ post, client, now }: { post: Post; client: ClientWithStats | undefined; now: number }) {
  const cfg = STATUS_INFO[post.status] ?? STATUS_INFO.draft
  const Icon = cfg.icon
  const when = post.scheduledAt
    ? new Date(post.scheduledAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'non planifié'

  const overdue = post.status === 'scheduled' && post.scheduledAt && post.scheduledAt < now

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
