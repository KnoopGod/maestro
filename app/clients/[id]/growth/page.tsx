import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, TrendingUp, Target, Zap, CheckCircle2, AlertCircle, Clock, Users } from 'lucide-react'
import { getClient } from '@/lib/db/queries/clients'
import { listPosts } from '@/lib/db/queries/posts'
import { BUSINESS_OBJECTIVES, BUSINESS_TARGET_DELAYS, CONVERSION_CHANNELS } from '@/types/client'
import type { Post } from '@/types/post'

export const dynamic = 'force-dynamic'

const MONTH_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

function parseFrequencyPerMonth(frequency: string): number {
  const match = frequency.match(/(\d+)\s*posts?\s*\/\s*(semaine|week|mois|month)/i)
  if (!match) return 0
  const n = parseInt(match[1])
  const unit = match[2].toLowerCase()
  return unit.startsWith('sem') || unit.startsWith('week') ? n * 4 : n
}

function engagementSummary(posts: Post[]) {
  let reach = 0, likes = 0, comments = 0
  for (const p of posts) {
    for (const ins of p.metaInsights ?? []) {
      reach += ins.reach ?? 0
      likes += ins.likes ?? 0
      comments += ins.comments ?? 0
    }
  }
  return { reach, likes, comments }
}

export default async function GrowthPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await getClient(id)
  if (!client) notFound()

  const allPosts = await listPosts({ clientId: id, limit: 500, includeInsights: true })
  const publishedPosts = allPosts.filter(p => p.status === 'published')

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime()
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime()
  const daysElapsed = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

  const thisMonthPosts = publishedPosts.filter(
    p => p.publishedAt && p.publishedAt >= monthStart && p.publishedAt < monthEnd
  )

  // Last 3 months trend
  const monthlyTrend = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (2 - i), 1)
    const start = d.getTime()
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime()
    return {
      label: MONTH_FR[d.getMonth()],
      count: publishedPosts.filter(p => p.publishedAt && p.publishedAt >= start && p.publishedAt < end).length,
      isCurrent: i === 2,
    }
  })

  // Frequency target
  const targetPerMonth = parseFrequencyPerMonth(client.strategy?.frequency ?? '')
  const proRataTarget = targetPerMonth > 0 ? Math.round(targetPerMonth * daysElapsed / daysInMonth) : 0

  // Impact score (last 30 days)
  const thirtyDaysAgo = monthStart - 30 * 24 * 3600 * 1000
  const recentPosts = publishedPosts.filter(p => p.publishedAt && p.publishedAt >= thirtyDaysAgo)
  const avgImpact = recentPosts.length > 0
    ? Math.round(recentPosts.reduce((s, p) => s + p.impactScore, 0) / recentPosts.length)
    : null

  // Engagement for the current month
  const { reach, likes, comments } = engagementSummary(thisMonthPosts)
  const hasInsights = thisMonthPosts.some(p => (p.metaInsights ?? []).length > 0)

  // Growth health score
  const cadenceOk = proRataTarget > 0 ? thisMonthPosts.length >= proRataTarget : thisMonthPosts.length > 0
  const impactOk = avgImpact != null && avgImpact >= 60
  const health: 'green' | 'amber' | 'red' =
    cadenceOk && impactOk ? 'green' :
    cadenceOk || impactOk ? 'amber' : 'red'

  const HEALTH = {
    green: { label: 'En bonne trajectoire', color: 'text-emerald-400', border: 'border-emerald-700/40', bg: 'bg-emerald-950/30', Icon: CheckCircle2 },
    amber: { label: 'Attention requise', color: 'text-amber-400', border: 'border-amber-700/40', bg: 'bg-amber-950/30', Icon: AlertCircle },
    red:   { label: 'Stagnation détectée', color: 'text-red-400', border: 'border-red-700/40', bg: 'bg-red-950/30', Icon: AlertCircle },
  }
  const hc = HEALTH[health]

  const businessProfile = client.businessProfile
  const objConfig = businessProfile ? BUSINESS_OBJECTIVES[businessProfile.priorityObjective] : null
  const delayConfig = businessProfile ? BUSINESS_TARGET_DELAYS[businessProfile.targetDelay] : null

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href={`/clients/${client.id}`}
        title={`Retourner à la fiche de ${client.name}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à {client.name}
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-emerald-400" />
          Croissance · {client.name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Objectif business, cadence de publication et métriques clés.
        </p>
      </div>

      {/* Health indicator */}
      <div className={`rounded-2xl border ${hc.border} ${hc.bg} p-5 flex items-center gap-4`}>
        <hc.Icon className={`w-8 h-8 ${hc.color} flex-shrink-0`} />
        <div>
          <div className={`text-lg font-semibold ${hc.color}`}>{hc.label}</div>
          <div className="text-sm text-gray-400 mt-0.5">
            {health === 'green' && "La cadence et l'impact sont au rendez-vous ce mois."}
            {health === 'amber' && (
              cadenceOk
                ? "La cadence est bonne, mais l'impact moyen est en dessous de 60."
                : impactOk
                  ? "L'impact est bon, mais la cadence de publication est insuffisante."
                  : 'Cadence et impact sont insuffisants.'
            )}
            {health === 'red' && 'Aucun post publié ce mois ou impact trop faible. Action requise.'}
          </div>
        </div>
      </div>

      {/* Objective */}
      {businessProfile && objConfig ? (
        <section className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-base font-semibold text-white">{objConfig.label}</h2>
                {delayConfig && (
                  <span className="text-[10px] border border-purple-700/40 bg-purple-950/30 text-purple-300 rounded-full px-2 py-0.5 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    Objectif {delayConfig.label}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1">{objConfig.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {businessProfile.conversionChannels.length > 0 && (
              <div className="bg-gray-950/40 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Canaux de conversion</div>
                <div className="flex flex-wrap gap-1.5">
                  {businessProfile.conversionChannels.map(ch => (
                    <span key={ch} className="text-[11px] border border-gray-700 rounded-full px-2 py-0.5 text-gray-300">
                      {CONVERSION_CHANNELS[ch]?.label ?? ch}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {businessProfile.mainOffers.length > 0 && (
              <div className="bg-gray-950/40 rounded-xl p-3">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Offres principales</div>
                <div className="flex flex-wrap gap-1.5">
                  {businessProfile.mainOffers.map(offer => (
                    <span key={offer} className="text-[11px] border border-gray-700 rounded-full px-2 py-0.5 text-gray-300">
                      {offer}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(businessProfile.monthlyRevenueEur != null || businessProfile.avgBasketEur != null) && (
              <div className="bg-gray-950/40 rounded-xl p-3 sm:col-span-2">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Repères financiers</div>
                <div className="flex flex-wrap gap-4">
                  {businessProfile.monthlyRevenueEur != null && (
                    <div>
                      <div className="text-base font-semibold text-white">{businessProfile.monthlyRevenueEur.toLocaleString('fr-FR')} €</div>
                      <div className="text-[10px] text-gray-500">CA mensuel actuel</div>
                    </div>
                  )}
                  {businessProfile.avgBasketEur != null && (
                    <div>
                      <div className="text-base font-semibold text-white">{businessProfile.avgBasketEur.toLocaleString('fr-FR')} €</div>
                      <div className="text-[10px] text-gray-500">Panier moyen</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      ) : (
        <div className="bg-gray-900/20 border border-dashed border-gray-700 rounded-2xl p-6 text-center">
          <Target className="w-8 h-8 text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Aucun profil business configuré pour ce client.</p>
          <Link
            href={`/clients/${client.id}/edit`}
            title={`Configurer le profil business de ${client.name}`}
            className="text-sm text-purple-400 hover:underline mt-2 inline-block"
          >
            Configurer le profil business →
          </Link>
        </div>
      )}

      {/* Monthly KPIs */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Ce mois · {MONTH_FR[now.getMonth()]} {now.getFullYear()}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard
            label="Posts publiés"
            value={thisMonthPosts.length.toString()}
            sub={targetPerMonth > 0 ? `Objectif : ${targetPerMonth}/mois` : client.strategy?.frequency ?? '—'}
            ok={cadenceOk}
          />
          <KpiCard
            label="Score d'impact"
            value={avgImpact != null ? `${avgImpact}/100` : '—'}
            sub="Moy. 30 derniers jours"
            ok={impactOk}
          />
          <KpiCard
            label="Reach Meta"
            value={hasInsights ? reach.toLocaleString('fr-FR') : '—'}
            sub={hasInsights ? 'Personnes touchées' : 'Insights non récupérés'}
            ok={hasInsights && reach > 0}
          />
          <KpiCard
            label="Interactions"
            value={hasInsights ? (likes + comments).toLocaleString('fr-FR') : '—'}
            sub={hasInsights ? `${likes} ♥ · ${comments} 💬` : '—'}
            ok={hasInsights && (likes + comments) > 0}
          />
        </div>
      </section>

      {/* 3-month trend */}
      <section className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Tendance publications (3 mois)
        </h2>
        <div className="flex items-end gap-4">
          {monthlyTrend.map((m, i) => {
            const max = Math.max(...monthlyTrend.map(x => x.count), 1)
            const heightPct = Math.round((m.count / max) * 100)
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-sm font-semibold text-white">{m.count}</div>
                <div className="w-full flex items-end justify-center" style={{ height: 60 }}>
                  <div
                    className={`w-full rounded-t-md transition-all ${m.isCurrent ? 'bg-emerald-600' : 'bg-gray-700'}`}
                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                  />
                </div>
                <div className={`text-[11px] ${m.isCurrent ? 'text-emerald-400 font-medium' : 'text-gray-500'}`}>
                  {m.label}
                </div>
              </div>
            )
          })}
          {targetPerMonth > 0 && (
            <div className="flex-1 flex flex-col items-center gap-2 border-l border-gray-700 pl-4">
              <div className="text-sm font-semibold text-purple-300">{targetPerMonth}</div>
              <div className="w-full flex items-end justify-center" style={{ height: 60 }}>
                <div className="w-full rounded-t-md bg-purple-900/50 border border-purple-700/40" style={{ height: '100%' }} />
              </div>
              <div className="text-[11px] text-purple-400">Cible/mois</div>
            </div>
          )}
        </div>
      </section>

      {/* Recommendations */}
      <section>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          Recommandations
        </h2>
        <div className="space-y-2">
          {!cadenceOk && targetPerMonth > 0 && (
            <Recommendation
              type="warning"
              text={`Cadence insuffisante : ${thisMonthPosts.length} posts publiés ce mois, objectif pro-rata : ${proRataTarget}. Il reste ${daysInMonth - daysElapsed} jours pour publier ${Math.max(0, proRataTarget - thisMonthPosts.length)} post${proRataTarget - thisMonthPosts.length > 1 ? 's' : ''} supplémentaire${proRataTarget - thisMonthPosts.length > 1 ? 's' : ''}.`}
              action={`/studio?client=${client.id}`}
              actionLabel="Créer un post"
            />
          )}
          {!impactOk && avgImpact != null && (
            <Recommendation
              type="warning"
              text={`Score d'impact moyen de ${avgImpact}/100 — en dessous du seuil de 60. Affiner le brief ou l'image pour améliorer la qualité.`}
              action={`/studio?client=${client.id}`}
              actionLabel="Générer un post"
            />
          )}
          {avgImpact === null && publishedPosts.length === 0 && (
            <Recommendation
              type="info"
              text="Aucun post publié pour ce client. Commencez par générer et publier votre premier post."
              action={`/studio?client=${client.id}`}
              actionLabel="Créer le premier post"
            />
          )}
          {businessProfile?.offDays && businessProfile.offDays.length > 0 && thisMonthPosts.length > 0 && (
            <Recommendation
              type="info"
              text={`Jours creux déclarés : ${businessProfile.offDays.join(', ')}. Programmez des posts offre spéciale sur ces jours pour stimuler la fréquentation.`}
              action={`/calendar`}
              actionLabel="Voir le calendrier"
            />
          )}
          {cadenceOk && impactOk && (
            <Recommendation
              type="success"
              text="Excellente cadence et bon score d'impact ce mois. Continuez sur cette lancée et vérifiez les insights Meta pour affiner les prochains contenus."
              action={`/clients/${client.id}/analytics`}
              actionLabel="Voir les analytics"
            />
          )}
        </div>
      </section>

      {/* Quick links */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-800">
        <Link
          href={`/studio?client=${client.id}`}
          title={`Créer un nouveau post pour ${client.name}`}
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          + Générer un post →
        </Link>
        <Link
          href={`/clients/${client.id}/report`}
          title={`Voir le bilan mensuel de ${client.name}`}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Bilan mensuel →
        </Link>
        <Link
          href={`/clients/${client.id}/analytics`}
          title={`Voir les insights Meta de ${client.name}`}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Analytics Meta →
        </Link>
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub, ok }: { label: string; value: string; sub: string; ok?: boolean }) {
  return (
    <div title={`${label} : ${value}`} className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{label}</div>
      <div className={`text-xl font-bold ${ok === true ? 'text-emerald-400' : ok === false ? 'text-amber-400' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-[10px] text-gray-500 mt-0.5">{sub}</div>
    </div>
  )
}

function Recommendation({
  type,
  text,
  action,
  actionLabel,
}: {
  type: 'success' | 'warning' | 'info'
  text: string
  action: string
  actionLabel: string
}) {
  const styles = {
    success: { border: 'border-emerald-800/40', bg: 'bg-emerald-950/20', dot: 'bg-emerald-400' },
    warning: { border: 'border-amber-800/40', bg: 'bg-amber-950/20', dot: 'bg-amber-400' },
    info:    { border: 'border-blue-800/40', bg: 'bg-blue-950/20', dot: 'bg-blue-400' },
  }
  const s = styles[type]
  return (
    <div className={`flex items-start gap-3 rounded-xl border ${s.border} ${s.bg} p-4`}>
      <div className={`w-1.5 h-1.5 rounded-full ${s.dot} mt-1.5 flex-shrink-0`} />
      <div className="flex-1">
        <p className="text-sm text-gray-300">{text}</p>
        <Link
          href={action}
          title={actionLabel}
          className="text-[11px] text-purple-400 hover:underline mt-1 inline-block"
        >
          {actionLabel} →
        </Link>
      </div>
    </div>
  )
}
