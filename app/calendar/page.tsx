import Link from 'next/link'
import { CalendarDays, Clock, CheckCircle2, AlertCircle, Sparkles, Plus, Download } from 'lucide-react'
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

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; client?: string }>
}) {
  const { week: weekParam, client: clientFilter } = await searchParams
  const weekOffset = parseInt(weekParam ?? '0', 10) || 0

  // Toutes les statuses : la vue semaine affiche aussi les posts publiés
  const [posts, clients] = await Promise.all([
    listPosts({ limit: 200, includeInsights: false }),
    listClientsWithStats(),
  ])
  const clientsMap = new Map<string, ClientWithStats>(clients.map(c => [c.id, c]))

  // Sort: scheduled posts first (by date asc), then drafts/ready (newest first), then published (newest first)
  const filteredPosts = clientFilter ? posts.filter(p => p.clientId === clientFilter) : posts

  const planned = filteredPosts
    .filter(p => p.status === 'scheduled')
    .sort((a, b) => (a.scheduledAt ?? 0) - (b.scheduledAt ?? 0))

  const inProgress = filteredPosts
    .filter(p => p.status === 'draft' || p.status === 'ready')
    .sort((a, b) => b.createdAt - a.createdAt)

  const now = new Date().getTime()
  const dueSoonCount = planned.filter(p => (p.scheduledAt ?? Infinity) <= now).length
  const next7d = planned.filter(p => (p.scheduledAt ?? 0) <= now + 7 * 24 * 3600_000).length

  // ─── Weekly grid ────────────────────────────────────────────────────────────
  const today = new Date()
  // Monday of current week + offset
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7) + weekOffset * 7)
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

  const buildAdjacency = (list: Post[]) => new Map(list.map((p, i) => [p.id, { prevId: list[i - 1]?.id, nextId: list[i + 1]?.id }]))
  const plannedAdj = buildAdjacency(planned)
  const inProgressAdj = buildAdjacency(inProgress)

  const activeClients = clients.filter(c => c.status === 'active')
  const displayedClients = clientFilter
    ? activeClients.filter(c => c.id === clientFilter)
    : activeClients
  const todayIndex = weekOffset === 0 ? (today.getDay() + 6) % 7 : -1

  function calUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    const params: Record<string, string | undefined> = {
      week: weekOffset !== 0 ? String(weekOffset) : undefined,
      client: clientFilter,
      ...overrides,
    }
    for (const [k, v] of Object.entries(params)) {
      if (v) p.set(k, v)
    }
    const qs = p.toString()
    return `/calendar${qs ? `?${qs}` : ''}`
  }

  const prevWeekHref = calUrl({ week: String(weekOffset - 1) })
  const nextWeekHref = calUrl({ week: String(weekOffset + 1) })
  const weekRangeLabel = `${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`

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
        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex items-center gap-1 bg-gray-900/60 border border-gray-700 rounded-lg p-1">
            <Link
              href={prevWeekHref}
              className="px-2 py-1 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm"
              title="Semaine précédente"
            >
              ←
            </Link>
            <span className="text-xs text-gray-300 font-mono px-2 min-w-[160px] text-center">{weekRangeLabel}</span>
            <Link
              href={nextWeekHref}
              className="px-2 py-1 rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors text-sm"
              title="Semaine suivante"
            >
              →
            </Link>
          </div>
          {weekOffset !== 0 && (
            <Link
              href={calUrl({ week: undefined })}
              className="px-3 py-2 rounded-lg border border-indigo-700/50 text-indigo-300 hover:bg-indigo-950/30 text-xs transition-colors"
            >
              Aujourd&apos;hui
            </Link>
          )}
          <Link
            href={`/api/posts/export/ical${clientFilter ? `?clientId=${clientFilter}` : ''}`}
            title={clientFilter ? `Exporter les posts planifiés de ce client en iCal` : `Exporter tous les posts planifiés en iCal (Google Calendar, Apple Calendar…)`}
            className="px-3 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            iCal
          </Link>
          <PublishDueButton />
        </div>
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

      {/* Client filter chips */}
      {activeClients.length > 1 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-500">Client :</span>
          <Link
            href={calUrl({ client: undefined })}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              !clientFilter ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'
            }`}
          >
            Tous
          </Link>
          {activeClients.map(c => (
            <Link
              key={c.id}
              href={clientFilter === c.id ? calUrl({ client: undefined }) : calUrl({ client: c.id })}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                clientFilter === c.id
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : 'border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              {c.emoji} {c.name}
            </Link>
          ))}
        </div>
      )}

      {/* Weekly grid */}
      {activeClients.length > 0 && (
        <section className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-400" />
              Vue semaine
            </h2>
            {weekOffset !== 0 && (
              <span className="text-[10px] text-indigo-400/60 font-mono">
                {weekOffset > 0 ? `+${weekOffset}` : weekOffset} sem.
              </span>
            )}
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
                {displayedClients.map((c, idx) => {
                  const dayMap = clientDayMap.get(c.id) ?? new Map()
                  return (
                    <tr key={c.id} className={`border-b border-gray-800/50 ${idx % 2 === 1 ? 'bg-gray-900/20' : ''}`}>
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/clients/${c.id}`}
                          title={`Voir la fiche de ${c.name}`}
                          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        >
                          <span className="text-base">{c.emoji}</span>
                          <span className="text-[11px] text-gray-300 truncate max-w-[90px]">{c.name}</span>
                        </Link>
                      </td>
                      {weekDays.map((_, i) => {
                        const status = dayMap.get(i)
                        return (
                          <td key={i} className={`text-center py-2.5 px-2 ${i === todayIndex ? 'bg-indigo-950/20' : ''}`}>
                            {status ? (
                              <CalendarDot clientId={c.id} status={status} />
                            ) : (
                              <Link
                                href={`/studio?client=${c.id}`}
                                title={`Créer un post pour ${c.name} ce jour`}
                                className="inline-flex items-center justify-center w-5 h-5 rounded text-gray-800 hover:text-indigo-400 hover:bg-indigo-950/30 transition-colors mx-auto"
                              >
                                <Plus className="w-3 h-3" />
                              </Link>
                            )}
                          </td>
                        )
                      })}
                      <td className="pr-3 py-2.5">
                        <Link
                          href={`/studio?client=${c.id}`}
                          className="text-gray-700 hover:text-indigo-400 transition-colors"
                          title={`Créer un post pour ${c.name}`}
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
          <TimelineRow key={p.id} post={p} client={clientsMap.get(p.clientId)} now={now} weekOffset={weekOffset} clientFilter={clientFilter} prevId={plannedAdj.get(p.id)?.prevId} nextId={plannedAdj.get(p.id)?.nextId} />
        ))}
      </Section>

      {/* Brouillons / prêts */}
      <Section title="📝 En préparation" emptyLabel="Aucun brouillon en cours.">
        {inProgress.map(p => (
          <TimelineRow key={p.id} post={p} client={clientsMap.get(p.clientId)} now={now} weekOffset={weekOffset} clientFilter={clientFilter} prevId={inProgressAdj.get(p.id)?.prevId} nextId={inProgressAdj.get(p.id)?.nextId} />
        ))}
      </Section>
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

const CALENDAR_DOT_CFG: Record<'published' | 'scheduled' | 'draft', { cls: string; title: string; planStatus: string }> = {
  published: { cls: 'bg-emerald-500 hover:bg-emerald-400',    title: 'Publié — voir dans le plan',    planStatus: 'published' },
  scheduled: { cls: 'bg-blue-400 hover:bg-blue-300',          title: 'Planifié — voir dans le plan',  planStatus: 'scheduled' },
  draft:     { cls: 'bg-amber-400/60 hover:bg-amber-400/90',  title: 'Brouillon — voir dans le plan', planStatus: 'draft' },
}

function CalendarDot({ clientId, status }: { clientId: string; status: 'published' | 'scheduled' | 'draft' }) {
  const cfg = CALENDAR_DOT_CFG[status]
  return (
    <Link
      href={`/plan?client=${clientId}&status=${cfg.planStatus}`}
      title={cfg.title}
      className={`inline-block w-3 h-3 rounded-full mx-auto transition-colors ${cfg.cls}`}
    />
  )
}

function TimelineRow({ post, client, now, weekOffset, clientFilter, prevId, nextId }: { post: Post; client: ClientWithStats | undefined; now: number; weekOffset: number; clientFilter: string | undefined; prevId?: string; nextId?: string }) {
  const cfg = STATUS_INFO[post.status] ?? STATUS_INFO.draft
  const Icon = cfg.icon
  const when = post.scheduledAt
    ? new Date(post.scheduledAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'non planifié'

  const overdue = post.status === 'scheduled' && post.scheduledAt && post.scheduledAt < now
  const calParams = new URLSearchParams()
  if (weekOffset !== 0) calParams.set('week', String(weekOffset))
  if (clientFilter) calParams.set('client', clientFilter)
  const calBack = calParams.toString() ? `&calBack=${encodeURIComponent(calParams.toString())}` : ''

  return (
    <Link
      href={`/posts/${post.id}?from=calendar${prevId ? `&prevId=${prevId}` : ''}${nextId ? `&nextId=${nextId}` : ''}${calBack}`}
      title="Voir le détail de ce post"
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
