import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { getClient } from '@/lib/db/queries/clients'
import { listPosts } from '@/lib/db/queries/posts'
import { analyzePerformance } from '@/lib/agents/performance-analyst'
import { PrintButton } from '@/components/clients/PrintButton'
import { CLIENT_TYPES } from '@/types/client'
import type { Post } from '@/types/post'

export const dynamic = 'force-dynamic'

const MONTH_NAMES = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                     'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function engagementRate(post: Post): number | null {
  if (!post.metaInsights?.length) return null
  let sum = 0
  let n = 0
  for (const i of post.metaInsights) {
    const reach = i.reach ?? 0
    if (reach === 0) continue
    sum += ((i.likes ?? 0) + (i.comments ?? 0) + (i.shares ?? 0)) / reach * 100
    n++
  }
  return n ? parseFloat((sum / n).toFixed(2)) : null
}

export default async function ClientReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ month?: string }>
}) {
  const { id } = await params
  const { month: monthParam } = await searchParams
  const client = await getClient(id)
  if (!client) notFound()

  // ── Period ──────────────────────────────────────────────────────────────────
  const now = new Date()
  let year = now.getFullYear()
  let month = now.getMonth() // 0-indexed
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split('-').map(Number)
    if (m >= 1 && m <= 12) { year = y; month = m - 1 }
  }
  const periodStart = new Date(year, month, 1).getTime()
  const periodEnd = new Date(year, month + 1, 1).getTime()

  const prevMonth = new Date(year, month - 1, 1)
  const nextMonth = new Date(year, month + 1, 1)
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  // ── Data ────────────────────────────────────────────────────────────────────
  const allPosts = await listPosts({ clientId: id, limit: 500 })
  const published = allPosts.filter(p =>
    p.status === 'published' && p.publishedAt && p.publishedAt >= periodStart && p.publishedAt < periodEnd
  ).sort((a, b) => (a.publishedAt ?? 0) - (b.publishedAt ?? 0))
  const created = allPosts.filter(p => p.createdAt >= periodStart && p.createdAt < periodEnd)

  // KPIs
  const totals = published.reduce(
    (acc, p) => {
      for (const i of p.metaInsights ?? []) {
        acc.reach += i.reach ?? 0
        acc.likes += i.likes ?? 0
        acc.comments += i.comments ?? 0
        acc.shares += i.shares ?? 0
        acc.saves += i.saves ?? 0
      }
      return acc
    },
    { reach: 0, likes: 0, comments: 0, shares: 0, saves: 0 }
  )
  const interactions = totals.likes + totals.comments + totals.shares + totals.saves
  const rates = published.map(engagementRate).filter((r): r is number => r !== null)
  const avgRate = rates.length ? (rates.reduce((s, r) => s + r, 0) / rates.length).toFixed(1) : null
  const topPost = [...published].sort((a, b) => (engagementRate(b) ?? -1) - (engagementRate(a) ?? -1))[0]

  // Pillar coverage
  const pillars = client.strategy?.contentPillars ?? []
  const pillarCoverage = pillars.map(pillar => ({
    pillar,
    count: published.filter(p =>
      `${p.brief} ${p.caption}`.toLowerCase().includes(pillar.toLowerCase())
    ).length,
  }))

  // ── Performance Analyst (agent IA) ─────────────────────────────────────────
  const { analysis } = published.length > 0
    ? await analyzePerformance({
        client,
        posts: published.map(p => ({
          caption: p.caption,
          platforms: p.platforms,
          brief: p.brief,
          publishedAt: p.publishedAt,
          insights: p.metaInsights ?? [],
        })),
      })
    : { analysis: null }

  const typeCfg = CLIENT_TYPES[client.type]
  const periodLabel = `${MONTH_NAMES[month]} ${year}`

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Toolbar — hidden on print */}
      <div className="no-print flex items-center justify-between flex-wrap gap-3">
        <Link href={`/clients/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour au client
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/clients/${id}/report?month=${fmt(prevMonth)}`}
            className="p-2 rounded-lg border border-gray-800 text-gray-400 hover:bg-gray-800 transition-colors"
            aria-label="Mois précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <span className="text-sm text-gray-300 font-medium min-w-[130px] text-center">{periodLabel}</span>
          {!isCurrentMonth ? (
            <Link
              href={`/clients/${id}/report?month=${fmt(nextMonth)}`}
              className="p-2 rounded-lg border border-gray-800 text-gray-400 hover:bg-gray-800 transition-colors"
              aria-label="Mois suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <span className="p-2 rounded-lg border border-gray-900 text-gray-700">
              <ChevronRight className="w-4 h-4" />
            </span>
          )}
          <PrintButton />
        </div>
      </div>

      {/* ── The report document (white, agency deliverable) ── */}
      <article className="print-page bg-white text-gray-900 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <header className="px-10 pt-10 pb-8 border-b-2 border-gray-900">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-2">Bilan mensuel — Réseaux sociaux</p>
              <h1 className="text-3xl font-bold">{client.name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {typeCfg.label}{client.city ? ` · ${client.city}` : ''}
              </p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">{periodLabel}</div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">
                Généré le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </header>

        {/* KPIs */}
        <section className="px-10 py-8 border-b border-gray-200">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-4">Chiffres clés du mois</h2>
          <div className="grid grid-cols-4 gap-6">
            <Kpi value={published.length} label="Posts publiés" />
            <Kpi value={totals.reach > 0 ? totals.reach.toLocaleString('fr-FR') : '—'} label="Personnes touchées" />
            <Kpi value={interactions > 0 ? interactions.toLocaleString('fr-FR') : '—'} label="Interactions" />
            <Kpi value={avgRate ? `${avgRate}%` : '—'} label="Taux d'engagement" />
          </div>
          {totals.reach === 0 && published.length > 0 && (
            <p className="text-[11px] text-gray-400 mt-4 italic">
              Les métriques Meta seront disponibles après récupération des insights (Analytics → Récupérer les insights).
            </p>
          )}
        </section>

        {/* Top post */}
        {topPost && (
          <section className="px-10 py-8 border-b border-gray-200">
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-4">Post du mois</h2>
            <div className="flex gap-5">
              {topPost.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={topPost.imageUrl} alt="" className="w-32 h-32 rounded-lg object-cover flex-shrink-0 border border-gray-200" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed line-clamp-4">{topPost.caption}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span>{topPost.platforms.join(' + ')}</span>
                  {topPost.publishedAt && (
                    <span>{new Date(topPost.publishedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
                  )}
                  {engagementRate(topPost) !== null && (
                    <span className="font-semibold text-gray-900">{engagementRate(topPost)}% d&apos;engagement</span>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Posts list */}
        <section className="px-10 py-8 border-b border-gray-200">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-4">
            Publications du mois ({published.length})
          </h2>
          {published.length === 0 ? (
            <p className="text-sm text-gray-400 italic">
              Aucune publication ce mois-ci.{created.length > 0 ? ` ${created.length} post${created.length > 1 ? 's' : ''} en préparation.` : ''}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-200">
                  <th className="pb-2 pr-3 font-medium w-20">Date</th>
                  <th className="pb-2 pr-3 font-medium">Contenu</th>
                  <th className="pb-2 pr-3 font-medium w-24">Plateformes</th>
                  <th className="pb-2 font-medium text-right w-20">Engag.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {published.map(p => {
                  const rate = engagementRate(p)
                  return (
                    <tr key={p.id}>
                      <td className="py-2.5 pr-3 text-gray-500 text-xs align-top">
                        {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}
                      </td>
                      <td className="py-2.5 pr-3 align-top">
                        <span className="line-clamp-2">{p.brief || p.caption.slice(0, 100)}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-gray-500 text-xs align-top capitalize">
                        {p.platforms.join(', ')}
                      </td>
                      <td className="py-2.5 text-right align-top font-medium">
                        {rate !== null ? `${rate}%` : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* Pillar coverage */}
        {pillars.length > 0 && published.length > 0 && (
          <section className="px-10 py-8 border-b border-gray-200">
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-4">Couverture des piliers de contenu</h2>
            <div className="space-y-2.5">
              {pillarCoverage.map(({ pillar, count }) => {
                const max = Math.max(...pillarCoverage.map(p => p.count), 1)
                return (
                  <div key={pillar} className="flex items-center gap-3">
                    <span className="text-sm w-48 truncate flex-shrink-0">{pillar}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${count === 0 ? '' : 'bg-gray-900'}`}
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs w-8 text-right ${count === 0 ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                      {count === 0 ? '0 ⚠' : count}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* AI analysis */}
        {analysis && (
          <section className="px-10 py-8 border-b border-gray-200">
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-4">Analyse & recommandations</h2>
            <p className="text-sm leading-relaxed mb-5">{analysis.summary}</p>

            {analysis.patterns.length > 0 && (
              <div className="mb-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Ce qui fonctionne</h3>
                <ul className="space-y-1.5">
                  {analysis.patterns.map((p, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-gray-400 flex-shrink-0">→</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.recommendations.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Plan pour le mois prochain</h3>
                <ol className="space-y-2">
                  {analysis.recommendations.map((r, i) => (
                    <li key={i} className="text-sm flex gap-3">
                      <span className="w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] flex items-center justify-center flex-shrink-0 font-bold">{i + 1}</span>
                      <span className="leading-relaxed">{r}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </section>
        )}

        {/* Footer */}
        <footer className="px-10 py-6 flex items-center justify-between">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">
            Bilan généré par Maestro — gestion social media
          </p>
          <p className="text-[10px] text-gray-300">{periodLabel}</p>
        </footer>
      </article>
    </div>
  )
}

function Kpi({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <div className="text-3xl font-bold tabular-nums">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-gray-400 mt-1">{label}</div>
    </div>
  )
}
