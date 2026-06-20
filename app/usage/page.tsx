import Link from 'next/link'
import { DollarSign, Zap, MessageSquare, Eye, Sparkles, ExternalLink, TrendingUp, TrendingDown, CreditCard, Info, ArrowRight } from 'lucide-react'
import { getUsageStats } from '@/lib/db/queries/usage'

export const dynamic = 'force-dynamic'

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Fév', '03': 'Mar', '04': 'Avr', '05': 'Mai', '06': 'Juin',
  '07': 'Juil', '08': 'Août', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Déc',
}

function formatMonth(ym: string): string {
  const [, m] = ym.split('-')
  return MONTH_LABELS[m] ?? ym
}

function formatTokenCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toString()
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'à l\'instant'
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d < 30) return `il y a ${d}j`
  return new Date(ts).toLocaleDateString('fr-FR')
}

export default async function UsagePage() {
  const stats = await getUsageStats()

  const totalActivities = stats.postsCount + stats.imagesAnalyzed + stats.daSyntheses
  const maxClientCost = Math.max(...stats.byClient.map(c => c.cost), 0.001)
  const maxMonthCost = Math.max(...stats.byMonth.map(m => m.cost), 0.001)

  // Activity breakdown percentages
  const activityTotal = stats.byActivity.captionGeneration + stats.byActivity.visionAnalysis + stats.byActivity.daSynthesis || 1
  const captionPct = (stats.byActivity.captionGeneration / activityTotal) * 100
  const visionPct = (stats.byActivity.visionAnalysis / activityTotal) * 100
  const daPct = (stats.byActivity.daSynthesis / activityTotal) * 100

  // Trend: compare last two months
  const lastMonths = stats.byMonth.slice(-2)
  const trendDown = lastMonths.length === 2 && lastMonths[1].cost < lastMonths[0].cost
  const trendUp = lastMonths.length === 2 && lastMonths[1].cost > lastMonths[0].cost

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#E0E3FF] flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-emerald-400" />
            Usage & Coûts
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Estimation des coûts IA
            <span className="mx-2 text-gray-700">·</span>
            <span className="text-gray-500">{totalActivities} actions enregistrées</span>
          </p>
        </div>
        <a
          href="https://console.anthropic.com/settings/billing"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-1.5 text-sm text-purple-400 hover:text-purple-300 transition-colors duration-150 bg-purple-900/20 hover:bg-purple-900/30 border border-purple-800/30 hover:border-purple-700/50 rounded-lg px-3 py-2"
        >
          <ExternalLink className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-150" />
          Voir solde Anthropic
        </a>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Coût total"
          value={`$${stats.totalCost.toFixed(4)}`}
          icon={DollarSign}
          color="from-emerald-950/40"
          accent="text-emerald-300"
          border="border-emerald-800/30"
          sub={`${formatTokenCount(stats.totalTokens)} tokens`}
          prominent
        />
        <StatCard
          label="Posts générés"
          value={stats.postsCount}
          icon={MessageSquare}
          color="from-purple-950/40"
          accent="text-purple-300"
          border="border-purple-800/30"
          sub={`~$${(stats.byActivity.captionGeneration / (stats.postsCount || 1)).toFixed(4)}/post`}
        />
        <StatCard
          label="Images analysées"
          value={stats.imagesAnalyzed}
          icon={Eye}
          color="from-blue-950/40"
          accent="text-blue-300"
          border="border-blue-800/30"
          sub={`$${stats.byActivity.visionAnalysis.toFixed(4)} cumulé`}
        />
        <StatCard
          label="DA synthétisées"
          value={stats.daSyntheses}
          icon={Sparkles}
          color="from-pink-950/40"
          accent="text-pink-300"
          border="border-pink-800/30"
          sub={`$${stats.byActivity.daSynthesis.toFixed(4)} cumulé`}
        />
      </div>

      {/* Activity breakdown */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#E0E3FF] flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Répartition par activité
          </h2>
          <span className="text-xs text-gray-500 font-mono">{formatTokenCount(stats.totalTokens)} tokens total</span>
        </div>

        <div className="p-5 space-y-4">
          <ActivityBar
            label="Génération de captions"
            sub={`${stats.postsCount} posts`}
            badge="Claude Sonnet 4.6"
            badgeColor="text-purple-400 bg-purple-900/30 border-purple-800/40"
            cost={stats.byActivity.captionGeneration}
            pct={captionPct}
            color="from-purple-600 to-pink-600"
          />
          <ActivityBar
            label="Vision Analysis"
            sub={`${stats.imagesAnalyzed} images`}
            badge="Claude Vision"
            badgeColor="text-blue-400 bg-blue-900/30 border-blue-800/40"
            cost={stats.byActivity.visionAnalysis}
            pct={visionPct}
            color="from-blue-600 to-cyan-600"
          />
          <ActivityBar
            label="Direction Artistique"
            sub={`${stats.daSyntheses} synthèses`}
            badge="Claude Sonnet 4.6"
            badgeColor="text-purple-400 bg-purple-900/30 border-purple-800/40"
            cost={stats.byActivity.daSynthesis}
            pct={daPct}
            color="from-pink-600 to-fuchsia-600"
          />
        </div>

        <div className="px-5 pb-4 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-gray-600 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Les coûts Vision et DA sont estimés (pas encore trackés par appel). Les captions ont les coûts réels (input/output tokens × prix Anthropic).
          </p>
        </div>
      </div>

      {/* By client */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-800">
          <h2 className="text-base font-semibold text-[#E0E3FF] flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Coût par client
          </h2>
        </div>

        {stats.byClient.filter(c => c.cost > 0).length === 0 ? (
          <div className="py-12 text-center px-5">
            <DollarSign className="w-10 h-10 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-400 font-medium text-sm">Aucun coût enregistré</p>
            <p className="text-gray-600 text-xs mt-1">Les coûts apparaissent après la première génération</p>
            <Link
              href="/studio"
              className="inline-flex items-center gap-1.5 mt-4 text-sm text-purple-400 hover:text-purple-300 transition-colors duration-150 bg-purple-900/20 hover:bg-purple-900/30 border border-purple-800/30 rounded-lg px-3 py-2"
            >
              Créer un premier post
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="p-3 space-y-1">
            {stats.byClient.filter(c => c.cost > 0 || c.postsCount > 0).map(c => (
              <Link
                key={c.clientId}
                href={`/clients/${c.clientId}/finance`}
                className="group flex items-center gap-4 p-3 rounded-xl hover:bg-gray-800/40 transition-all duration-150 border border-transparent hover:border-gray-700/50"
              >
                <div className="text-xl w-8 text-center flex-shrink-0">{c.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#E0E3FF] truncate">{c.clientName}</div>
                  <div className="mt-1.5 w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-300"
                      style={{ width: `${(c.cost / maxClientCost) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right min-w-[90px] flex-shrink-0">
                  <div className="text-sm font-bold font-mono text-emerald-400">${c.cost.toFixed(4)}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{c.postsCount} post{c.postsCount > 1 ? 's' : ''}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all duration-150 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* By month */}
      {stats.byMonth.length > 0 && (
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-base font-semibold text-[#E0E3FF] flex items-center gap-2">
              {trendDown ? (
                <TrendingDown className="w-4 h-4 text-emerald-400" />
              ) : trendUp ? (
                <TrendingUp className="w-4 h-4 text-red-400" />
              ) : (
                <TrendingUp className="w-4 h-4 text-purple-400" />
              )}
              Évolution mensuelle
            </h2>
            {trendDown && (
              <span className="text-xs font-medium text-emerald-400 bg-emerald-900/30 border border-emerald-800/40 rounded-full px-2.5 py-1">
                Coûts en baisse
              </span>
            )}
            {trendUp && (
              <span className="text-xs font-medium text-red-400 bg-red-900/30 border border-red-800/40 rounded-full px-2.5 py-1">
                Coûts en hausse
              </span>
            )}
          </div>

          <div className="p-5">
            <div className="flex items-end gap-2 h-32">
              {stats.byMonth.map(m => {
                const height = Math.max((m.cost / maxMonthCost) * 100, 4)
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="text-[11px] text-gray-400 font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      ${m.cost.toFixed(4)}
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-purple-600 to-pink-500 rounded-t-md transition-all duration-150 hover:from-purple-500 hover:to-pink-400 hover:brightness-110"
                      style={{ height: `${height}%` }}
                      title={`${m.month}: $${m.cost.toFixed(4)} · ${m.postsCount} posts`}
                    />
                    <div className="text-[11px] text-gray-500">{formatMonth(m.month)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Recent activity */}
      {stats.recentPosts.length > 0 && (
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-800">
            <h2 className="text-base font-semibold text-[#E0E3FF] flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Activité récente
            </h2>
          </div>

          <div className="p-3 space-y-1">
            {stats.recentPosts.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-800/40 transition-all duration-150 border border-transparent hover:border-gray-700/40">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-300 truncate">{p.caption}</div>
                  <div className="text-[11px] text-gray-600 mt-0.5 flex items-center gap-2">
                    <span>{formatRelative(p.createdAt)}</span>
                    <span className="text-gray-700">·</span>
                    <span className="font-mono">{formatTokenCount(p.tokensUsed)} tokens</span>
                  </div>
                </div>
                <div className="text-sm font-bold font-mono text-emerald-400 flex-shrink-0">
                  ${p.cost.toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info banner */}
      <div className="bg-blue-950/20 border border-blue-800/30 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-blue-900/40 border border-blue-800/40 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Info className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-[#E0E3FF] mb-1">À propos de ces chiffres</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Les coûts caption sont <strong className="text-gray-300">réels</strong> (input/output tokens × prix Anthropic).
            Vision et DA sont <strong className="text-gray-300">estimés</strong> (~$0.009/image, ~$0.020/synthèse DA).
            Pour le solde exact, consulte la{' '}
            <a
              href="https://console.anthropic.com/settings/usage"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors duration-150"
            >
              Console Anthropic
            </a>.
          </p>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label, value, icon: Icon, color, accent, border, sub, prominent,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  accent: string
  border: string
  sub: string
  prominent?: boolean
}) {
  return (
    <div className={`bg-gradient-to-br ${color} to-gray-900/40 border ${border} rounded-2xl p-5 transition-all duration-150 hover:shadow-[0_0_16px_rgba(0,0,0,0.3)]`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <div className="w-7 h-7 rounded-lg bg-gray-800/60 border border-gray-700/50 flex items-center justify-center">
          <Icon className={`w-3.5 h-3.5 ${accent}`} />
        </div>
      </div>
      <div className={`${prominent ? 'text-3xl' : 'text-2xl'} font-bold text-[#E0E3FF] font-mono`}>{value}</div>
      <div className="text-[11px] text-gray-500 mt-1.5">{sub}</div>
    </div>
  )
}

function ActivityBar({
  label, sub, badge, badgeColor, cost, pct, color,
}: {
  label: string
  sub: string
  badge: string
  badgeColor: string
  cost: number
  pct: number
  color: string
}) {
  return (
    <div>
      <div className="flex items-start justify-between mb-2 gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-sm font-medium text-[#E0E3FF]">{label}</span>
          <span className={`text-[11px] font-medium border rounded-full px-2 py-0.5 flex-shrink-0 ${badgeColor}`}>{badge}</span>
          <span className="text-[11px] text-gray-500">{sub}</span>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-[11px] text-gray-500 font-mono">{pct.toFixed(1)}%</span>
          <span className="text-sm font-bold font-mono text-emerald-400">${cost.toFixed(4)}</span>
        </div>
      </div>
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
