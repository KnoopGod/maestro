import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getClientByPortalToken } from '@/lib/db/queries/portal'
import { listPosts } from '@/lib/db/queries/posts'
import { CLIENT_TYPES } from '@/types/client'
import type { Post } from '@/types/post'
import { PortalReviewCard } from '@/components/portal/PortalReviewCard'
import { PortalPrintButton } from '@/components/portal/PortalPrintButton'

// Page publique : jamais mise en cache, jamais indexée.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

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

export default async function ClientPortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ month?: string }>
}) {
  const { token } = await params
  const { month: monthParam } = await searchParams

  // Le jeton EST l'autorisation. Inconnu/révoqué → 404 générique, aucune fuite.
  const client = await getClientByPortalToken(token)
  if (!client) notFound()

  // ── Période (mois courant par défaut) ──────────────────────────────────────
  const now = new Date()
  let year = now.getFullYear()
  let month = now.getMonth()
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split('-').map(Number)
    if (m >= 1 && m <= 12) { year = y; month = m - 1 }
  }
  const periodStart = new Date(year, month, 1).getTime()
  const periodEnd = new Date(year, month + 1, 1).getTime()

  // ── Données (uniquement ce qui concerne le client — jamais de finance/interne) ─
  const allPosts = await listPosts({ clientId: client.id, limit: 500 })
  const pendingPosts = allPosts.filter(p => p.status === 'ready')
  const reviewedPosts = allPosts
    .filter(p => p.portalFeedback !== null && p.status !== 'ready')
    .sort((a, b) => (b.portalFeedback?.reviewedAt ?? 0) - (a.portalFeedback?.reviewedAt ?? 0))
    .slice(0, 5)
  const published = allPosts.filter(p =>
    p.status === 'published' && p.publishedAt && p.publishedAt >= periodStart && p.publishedAt < periodEnd
  ).sort((a, b) => (a.publishedAt ?? 0) - (b.publishedAt ?? 0))

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

  const typeCfg = CLIENT_TYPES[client.type]
  const periodLabel = `${MONTH_NAMES[month]} ${year}`

  return (
    <main className="min-h-screen bg-[#07080d] text-white px-4 py-8 sm:py-14 print:bg-white print:p-0 print:m-0">
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>
      <div className="max-w-3xl mx-auto">
        <div className="print:hidden flex justify-end mb-3">
          <PortalPrintButton />
        </div>
        <article className="bg-white text-gray-900 rounded-xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none">
          {/* Header */}
          <header className="px-6 sm:px-10 pt-10 pb-8 border-b-2 border-gray-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mb-2">Bilan mensuel — Réseaux sociaux</p>
                <h1 className="text-2xl sm:text-3xl font-bold">{client.name}</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {typeCfg.label}{client.city ? ` · ${client.city}` : ''}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-lg sm:text-xl font-bold">{periodLabel}</div>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">Espace client</p>
              </div>
            </div>
          </header>

          {/* Validation des posts — masquée à l'impression */}
          <section className="print:hidden px-6 sm:px-10 py-8 border-b border-gray-200">
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-4">
              Contenus en attente de votre validation
            </h2>
            {pendingPosts.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Aucun contenu en attente de validation.</p>
            ) : (
              <div className="space-y-4">
                {pendingPosts.map(p => (
                  <PortalReviewCard key={p.id} post={p} token={token} />
                ))}
              </div>
            )}
          </section>

          {/* Recently reviewed */}
          {reviewedPosts.length > 0 && (
            <section className="px-6 sm:px-10 py-8 border-b border-gray-200">
              <h2 className="text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-4">
                Contenus récemment examinés
              </h2>
              <div className="space-y-2">
                {reviewedPosts.map(p => {
                  const fb = p.portalFeedback!
                  return (
                    <div key={p.id} className={`rounded-xl p-3 border flex gap-3 items-start text-sm ${
                      fb.action === 'approved'
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-orange-200 bg-orange-50'
                    }`}>
                      {p.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 line-clamp-2 text-xs leading-relaxed">{p.caption}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] font-medium ${fb.action === 'approved' ? 'text-emerald-600' : 'text-orange-600'}`}>
                            {fb.action === 'approved' ? '✓ Approuvé' : '✎ Modifications demandées'}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(fb.reviewedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>
                        {fb.comment && (
                          <p className="text-[11px] text-gray-500 mt-1 italic">{fb.comment}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* KPIs */}
          <section className="px-6 sm:px-10 py-8 border-b border-gray-200">
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-4">Chiffres clés du mois</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <Kpi value={published.length} label="Posts publiés" />
              <Kpi value={totals.reach > 0 ? totals.reach.toLocaleString('fr-FR') : '—'} label="Personnes touchées" />
              <Kpi value={interactions > 0 ? interactions.toLocaleString('fr-FR') : '—'} label="Interactions" />
              <Kpi value={avgRate ? `${avgRate}%` : '—'} label="Taux d'engagement" />
            </div>
          </section>

          {/* Top post */}
          {topPost && (
            <section className="px-6 sm:px-10 py-8 border-b border-gray-200">
              <h2 className="text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-4">Post du mois</h2>
              <div className="flex gap-5">
                {topPost.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={topPost.imageUrl} alt="" className="w-28 h-28 sm:w-32 sm:h-32 rounded-lg object-cover flex-shrink-0 border border-gray-200" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed line-clamp-4">{topPost.caption}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-gray-500">
                    <span className="capitalize">{topPost.platforms.join(' + ')}</span>
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
          <section className="px-6 sm:px-10 py-8 border-b border-gray-200">
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-4">
              Publications du mois ({published.length})
            </h2>
            {published.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Aucune publication ce mois-ci.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-gray-400 border-b border-gray-200">
                    <th className="pb-2 pr-3 font-medium w-16">Date</th>
                    <th className="pb-2 pr-3 font-medium">Contenu</th>
                    <th className="pb-2 pr-3 font-medium w-24 hidden sm:table-cell">Plateformes</th>
                    <th className="pb-2 font-medium text-right w-16">Engag.</th>
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
                        <td className="py-2.5 pr-3 text-gray-500 text-xs align-top capitalize hidden sm:table-cell">
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

          {/* Footer */}
          <footer className="px-6 sm:px-10 py-6 flex items-center justify-between">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">
              Bilan généré par Maestro — gestion social media
            </p>
            <p className="text-[10px] text-gray-300">{periodLabel}</p>
          </footer>
        </article>

        <p className="print:hidden text-center text-[10px] text-gray-600 mt-6 font-mono tracking-wider">
          Lien privé · ne pas partager publiquement
        </p>
      </div>
    </main>
  )
}

function Kpi({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <div className="text-2xl sm:text-3xl font-bold tabular-nums">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-gray-400 mt-1">{label}</div>
    </div>
  )
}
