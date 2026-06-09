import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, AlertTriangle, CheckCircle2, Euro, Gauge, TrendingUp, WalletCards } from 'lucide-react'
import { getClient } from '@/lib/db/queries/clients'
import { runProfitController } from '@/lib/agents/profit-controller'
import { updateClientFinanceAction } from '@/lib/actions/finance'
import type { ProfitReport } from '@/types/finance'

export const dynamic = 'force-dynamic'

const STATUS_CFG: Record<ProfitReport['status'], { label: string; color: string; icon: React.ElementType }> = {
  profitable: { label: 'Rentable', color: 'border-emerald-700/40 bg-emerald-950/30 text-emerald-300', icon: CheckCircle2 },
  watch: { label: 'À surveiller', color: 'border-amber-700/40 bg-amber-950/30 text-amber-300', icon: AlertTriangle },
  loss: { label: 'En perte', color: 'border-red-700/40 bg-red-950/30 text-red-300', icon: AlertTriangle },
  missing_budget: { label: 'Budget à renseigner', color: 'border-gray-700 bg-gray-900/50 text-gray-300', icon: WalletCards },
}

export default async function ClientFinancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await getClient(id)
  if (!client) notFound()

  const report = await runProfitController(id)
  const cfg = STATUS_CFG[report.status]
  const StatusIcon = cfg.icon

  return (
    <div className="space-y-6 max-w-6xl">
      <Link href={`/clients/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300">
        <ArrowLeft className="w-4 h-4" />
        Retour à {client.name}
      </Link>

      <div className="flex items-start justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-emerald-500/70 font-mono mb-1">Profit Controller</div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Euro className="w-7 h-7 text-emerald-400" />
            Rentabilité · {client.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Coûts API, création média, budgets Meta/Google, temps interne et marge prévisionnelle.
          </p>
        </div>
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${cfg.color}`}>
          <StatusIcon className="w-4 h-4" />
          {cfg.label}
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="CA mensuel client" value={formatEuro(report.revenue)} sub="Abonnement / budget encaissé" />
        <MetricCard label="Coût total prévu" value={formatEuro(report.forecast.totalCost)} sub={`${report.budgetUse.totalCostPct}% du CA`} />
        <MetricCard label="Marge prévue" value={formatEuro(report.forecast.profit)} sub={`${report.forecast.marginPct}% · cible ${report.targetMarginPct}%`} tone={report.forecast.profit < 0 ? 'bad' : report.forecast.marginPct < report.targetMarginPct ? 'warn' : 'good'} />
        <MetricCard label="Coût par post prévu" value={formatEuro(report.forecast.costPerPlannedPost)} sub={`${report.settings.plannedPostsPerMonth} posts/mois`} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-emerald-400" />
            Analyse du mois · {report.monthLabel}
          </h2>

          <div className="space-y-4">
            <CostLine label="API + IA projetées" value={report.forecast.projectedApiCost} pct={report.budgetUse.apiPct} hint={`Budget API : ${formatEuro(report.settings.monthlyApiBudget)}`} />
            <CostLine label="Budgets Meta + Google Ads" value={report.forecast.adSpend} pct={report.revenue > 0 ? (report.forecast.adSpend / report.revenue) * 100 : 0} hint="Charges si incluses dans le forfait" />
            <CostLine label="Temps interne valorisé" value={report.forecast.internalCost} pct={report.revenue > 0 ? (report.forecast.internalCost / report.revenue) * 100 : 0} hint={`${report.settings.monthlyInternalHours}h × ${formatEuro(report.settings.hourlyInternalRate)}/h`} />
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-800">
            <SmallStat label="Posts générés" value={report.currentMonth.postsGenerated} />
            <SmallStat label="Images analysées" value={report.currentMonth.imagesAnalyzed} />
            <SmallStat label="Tokens utilisés" value={report.currentMonth.tokensUsed.toLocaleString('fr-FR')} />
          </div>
        </div>

        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            Recommandations
          </h2>
          <ul className="space-y-2">
            {report.recommendations.map(rec => (
              <li key={rec} className="text-xs text-gray-300 leading-relaxed rounded-lg bg-gray-950/40 border border-gray-800 p-2.5">
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FinanceForm clientId={id} report={report} />

        <div className="bg-blue-950/20 border border-blue-700/30 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Hypothèses de calcul</h2>
          <ul className="space-y-2">
            {report.assumptions.map(a => (
              <li key={a} className="text-xs text-blue-100/80 leading-relaxed">• {a}</li>
            ))}
          </ul>
          <p className="text-[11px] text-gray-500 mt-4">
            Objectif : éviter de vendre un forfait qui semble bon commercialement mais qui devient perdant une fois les API, médias, ads et ton temps inclus.
          </p>
        </div>
      </section>
    </div>
  )
}

function FinanceForm({ clientId, report }: { clientId: string; report: ProfitReport }) {
  const action = updateClientFinanceAction.bind(null, clientId)
  const s = report.settings

  return (
    <form action={action} className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
      <h2 className="text-sm font-semibold text-white mb-4">Paramètres financiers client</h2>
      <div className="grid grid-cols-2 gap-3">
        <NumberField name="monthlyRetainer" label="Abonnement mensuel (€)" value={s.monthlyRetainer} />
        <NumberField name="targetMarginPct" label="Marge cible (%)" value={s.targetMarginPct} />
        <NumberField name="monthlyApiBudget" label="Budget API max (€)" value={s.monthlyApiBudget} />
        <NumberField name="monthlyMetaAdsBudget" label="Budget Meta Ads (€)" value={s.monthlyMetaAdsBudget} />
        <NumberField name="monthlyGoogleAdsBudget" label="Budget Google Ads (€)" value={s.monthlyGoogleAdsBudget} />
        <NumberField name="plannedPostsPerMonth" label="Posts / mois" value={s.plannedPostsPerMonth} step="1" />
        <NumberField name="plannedImagesPerMonth" label="Images IA / mois" value={s.plannedImagesPerMonth} step="1" />
        <NumberField name="plannedVideosPerMonth" label="Vidéos IA / mois" value={s.plannedVideosPerMonth} step="1" />
        <NumberField name="hourlyInternalRate" label="Taux horaire interne (€)" value={s.hourlyInternalRate} />
        <NumberField name="monthlyInternalHours" label="Heures internes / mois" value={s.monthlyInternalHours} />
      </div>
      <button className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500">
        Sauvegarder et recalculer
      </button>
    </form>
  )
}

function NumberField({ name, label, value, step = '0.01' }: { name: string; label: string; value: number; step?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-gray-500">{label}</span>
      <input
        name={name}
        type="number"
        step={step}
        min="0"
        defaultValue={value}
        className="w-full rounded-lg border border-gray-800 bg-gray-950/60 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
      />
    </label>
  )
}

function MetricCard({ label, value, sub, tone = 'neutral' }: { label: string; value: string; sub: string; tone?: 'neutral' | 'good' | 'warn' | 'bad' }) {
  const toneClass = tone === 'good' ? 'text-emerald-300' : tone === 'warn' ? 'text-amber-300' : tone === 'bad' ? 'text-red-300' : 'text-white'
  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-5">
      <div className="text-[11px] text-gray-500 mb-2">{label}</div>
      <div className={`text-2xl font-bold font-mono ${toneClass}`}>{value}</div>
      <div className="text-[11px] text-gray-500 mt-1">{sub}</div>
    </div>
  )
}

function CostLine({ label, value, pct, hint }: { label: string; value: number; pct: number; hint: string }) {
  const width = Math.min(Math.max(pct, 4), 100)
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <div>
          <div className="text-sm text-white">{label}</div>
          <div className="text-[11px] text-gray-500">{hint}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-mono text-emerald-300">{formatEuro(value)}</div>
          <div className="text-[10px] text-gray-500">{pct.toFixed(1)}%</div>
        </div>
      </div>
      <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-lime-400" style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

function SmallStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-gray-950/40 border border-gray-800 p-3">
      <div className="text-[10px] text-gray-500">{label}</div>
      <div className="text-sm font-bold text-white mt-1">{value}</div>
    </div>
  )
}

function formatEuro(value: number) {
  return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}
