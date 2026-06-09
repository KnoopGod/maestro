import Link from 'next/link'
import { DollarSign, Zap, MessageSquare, Eye, Sparkles, ExternalLink, TrendingUp } from 'lucide-react'
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

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-7 h-7 text-emerald-400" />
            Usage & Coûts
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Estimation des coûts IA · {totalActivities} actions enregistrées
          </p>
        </div>
        <a
          href="https://console.anthropic.com/settings/billing"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-purple-400 hover:underline flex items-center gap-1.5"
        >
          <ExternalLink className="w-4 h-4" />
          Voir solde Anthropic
        </a>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Coût total estimé"
          value={`$${stats.totalCost.toFixed(4)}`}
          icon={DollarSign}
          color="from-emerald-950/40"
          accent="text-emerald-300"
          border="border-emerald-800/30"
          sub={`${stats.totalTokens.toLocaleString()} tokens`}
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
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Répartition par activité</h2>

        <div className="space-y-4">
          <ActivityBar
            label="Génération de captions"
            sub={`${stats.postsCount} posts · Claude Sonnet 4.6`}
            cost={stats.byActivity.captionGeneration}
            pct={captionPct}
            color="from-purple-600 to-pink-600"
          />
          <ActivityBar
            label="Vision Analysis"
            sub={`${stats.imagesAnalyzed} images · Claude Vision`}
            cost={stats.byActivity.visionAnalysis}
            pct={visionPct}
            color="from-blue-600 to-cyan-600"
          />
          <ActivityBar
            label="Direction Artistique"
            sub={`${stats.daSyntheses} synthèses · Claude Sonnet 4.6`}
            cost={stats.byActivity.daSynthesis}
            pct={daPct}
            color="from-pink-600 to-fuchsia-600"
          />
        </div>

        <p className="text-[11px] text-gray-600 mt-4">
          💡 Les coûts Vision et DA sont estimés (pas encore trackés par appel). Les captions ont les coûts réels (input/output tokens × prix Anthropic).
        </p>
      </div>

      {/* By client */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Coût par client</h2>

        {stats.byClient.filter(c => c.cost > 0).length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            Aucun coût enregistré.{' '}
            <Link href="/studio" className="text-purple-400 hover:underline">
              Créer un premier post →
            </Link>
          </p>
        ) : (
          <div className="space-y-3">
            {stats.byClient.filter(c => c.cost > 0 || c.postsCount > 0).map(c => (
              <Link
                key={c.clientId}
                href={`/clients/${c.clientId}/finance`}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-800/40 transition-colors"
              >
                <div className="text-xl">{c.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{c.clientName}</div>
                  <div className="mt-1.5 w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                      style={{ width: `${(c.cost / maxClientCost) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right min-w-[80px]">
                  <div className="text-sm font-bold text-emerald-400">${c.cost.toFixed(4)}</div>
                  <div className="text-[10px] text-gray-500">{c.postsCount} post{c.postsCount > 1 ? 's' : ''}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* By month */}
      {stats.byMonth.length > 0 && (
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            Évolution mensuelle
          </h2>

          <div className="flex items-end gap-2 h-32">
            {stats.byMonth.map(m => {
              const height = Math.max((m.cost / maxMonthCost) * 100, 4)
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    ${m.cost.toFixed(4)}
                  </div>
                  <div
                    className="w-full bg-gradient-to-t from-purple-600 to-pink-500 rounded-t-md transition-all hover:from-purple-500 hover:to-pink-400"
                    style={{ height: `${height}%` }}
                    title={`${m.month}: $${m.cost.toFixed(4)} · ${m.postsCount} posts`}
                  />
                  <div className="text-[10px] text-gray-500">{formatMonth(m.month)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent activity */}
      {stats.recentPosts.length > 0 && (
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Activité récente
          </h2>

          <div className="space-y-2">
            {stats.recentPosts.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/30">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-300 truncate">{p.caption}</div>
                  <div className="text-[10px] text-gray-600 mt-0.5">
                    {formatRelative(p.createdAt)} · {p.tokensUsed.toLocaleString()} tokens
                  </div>
                </div>
                <div className="text-sm font-mono text-emerald-400 flex-shrink-0">
                  ${p.cost.toFixed(4)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info banner */}
      <div className="bg-blue-950/20 border border-blue-700/30 rounded-2xl p-4 text-sm text-gray-300 flex items-start gap-3">
        <span className="text-xl">💡</span>
        <div>
          <p className="font-medium text-white mb-1">À propos de ces chiffres</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Les coûts caption sont <strong>réels</strong> (input/output tokens × prix Anthropic).
            Vision et DA sont <strong>estimés</strong> (~$0.009/image, ~$0.020/synthèse DA).
            Pour le solde exact, vérifie ta{' '}
            <a href="https://console.anthropic.com/settings/usage" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
              Console Anthropic
            </a>.
          </p>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label, value, icon: Icon, color, accent, border, sub,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
  accent: string
  border: string
  sub: string
}) {
  return (
    <div className={`bg-gradient-to-br ${color} to-gray-900/40 border ${border} rounded-xl p-5`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-xs ${accent}`}>{label}</span>
        <Icon className={`w-4 h-4 ${accent}`} />
      </div>
      <div className="text-2xl font-bold text-white font-mono">{value}</div>
      <div className="text-[11px] text-gray-500 mt-1">{sub}</div>
    </div>
  )
}

function ActivityBar({
  label, sub, cost, pct, color,
}: {
  label: string
  sub: string
  cost: number
  pct: number
  color: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <span className="text-sm text-white font-medium">{label}</span>
          <span className="text-[11px] text-gray-500 ml-2">{sub}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-gray-500">{pct.toFixed(1)}%</span>
          <span className="text-sm font-mono text-emerald-400">${cost.toFixed(4)}</span>
        </div>
      </div>
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${color} rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
