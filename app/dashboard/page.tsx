'use client'
import { useCommandCenterStore } from '@/store/useCommandCenterStore'
import { getModeConfig } from '@/lib/mode-config'
import { AI_MODELS } from '@/lib/mock-data/models'
import { MONTHLY_STATS } from '@/lib/mock-data/cost-estimates'
import { StatusCard } from '@/components/dashboard/StatusCard'
import { RecentTasksFeed } from '@/components/dashboard/RecentTasksFeed'
import { AlertBanner } from '@/components/dashboard/AlertBanner'
import { LiveTest } from '@/components/dashboard/LiveTest'
import { LiveStatus } from '@/components/dashboard/LiveStatus'
import { TrendingDown, Zap, Activity } from 'lucide-react'

export default function DashboardPage() {
  const { activeMode } = useCommandCenterStore()
  const modeConfig = getModeConfig(activeMode)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Vue globale de tes IAs et activités</p>
        </div>
        <div className="flex items-center gap-2 bg-purple-900/30 border border-purple-700/30 rounded-lg px-4 py-2">
          <span className="text-lg">{modeConfig.icon}</span>
          <div>
            <div className="text-xs text-purple-300 font-semibold">{modeConfig.label}</div>
            <div className="text-[10px] text-purple-400/60">{modeConfig.description}</div>
          </div>
        </div>
      </div>

      {/* Stat summary row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: 'Coût ce mois',
            value: `$${MONTHLY_STATS.totalCostOptimized.toFixed(2)}`,
            sub: `sur $${(MONTHLY_STATS.totalCostOptimized + MONTHLY_STATS.totalSavings).toFixed(2)} brut`,
            icon: Zap,
            color: 'text-purple-400',
          },
          {
            label: 'Économies',
            value: `$${MONTHLY_STATS.totalSavings.toFixed(2)}`,
            sub: `${MONTHLY_STATS.savingsPercent}% économisé`,
            icon: TrendingDown,
            color: 'text-emerald-400',
          },
          {
            label: 'Tokens utilisés',
            value: `${(MONTHLY_STATS.totalTokensUsed / 1000).toFixed(0)}k`,
            sub: `${(MONTHLY_STATS.totalTokensOptimized / 1000).toFixed(0)}k après optim.`,
            icon: Activity,
            color: 'text-amber-400',
          },
          {
            label: 'Tâches Ollama',
            value: `${MONTHLY_STATS.tasksByAI.ollama}`,
            sub: `sur ${Object.values(MONTHLY_STATS.tasksByAI).reduce((a, b) => a + b, 0)} totales`,
            icon: () => <span className="text-base">🏠</span>,
            color: 'text-amber-400',
          },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* AI Status Cards */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Statut des IAs</h2>
        <div className="grid grid-cols-4 gap-4">
          {AI_MODELS.map((model) => (
            <StatusCard key={model.id} model={model} />
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-6">
        <RecentTasksFeed />
        <AlertBanner />
      </div>

      {/* Live status + test */}
      <div className="grid grid-cols-2 gap-6">
        <LiveStatus />
        <LiveTest />
      </div>
    </div>
  )
}
