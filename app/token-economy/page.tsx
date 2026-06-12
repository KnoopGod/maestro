'use client'
import { MONTHLY_STATS, COST_ESTIMATES } from '@/lib/mock-data/cost-estimates'
import { GaugeBar } from '@/components/ui/GaugeBar'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const PIE_DATA = [
  { name: 'Claude',  value: MONTHLY_STATS.tasksByAI.claude,  color: '#7C3AED' },
  { name: 'ChatGPT', value: MONTHLY_STATS.tasksByAI.chatgpt, color: '#10A37F' },
  { name: 'Ollama',  value: MONTHLY_STATS.tasksByAI.ollama,  color: '#F59E0B' },
]

export default function TokenEconomyPage() {
  const total = Object.values(MONTHLY_STATS.tasksByAI).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Token & Cost Economy</h1>
        <p className="text-sm text-gray-500 mt-0.5">Analyse ta consommation et tes économies IA</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Sans optimisation',  value: `$${MONTHLY_STATS.totalCostWithoutOptimization.toFixed(2)}`, sub: `${(MONTHLY_STATS.totalTokensUsed/1000).toFixed(0)}k tokens`, color: 'text-red-400' },
          { label: 'Après optimisation', value: `$${MONTHLY_STATS.totalCostOptimized.toFixed(2)}`,           sub: `${(MONTHLY_STATS.totalTokensOptimized/1000).toFixed(0)}k tokens`, color: 'text-emerald-400' },
          { label: 'Économies totales',  value: `$${MONTHLY_STATS.totalSavings.toFixed(2)}`,                 sub: `${MONTHLY_STATS.savingsPercent}% économisé`, color: 'text-purple-400' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 text-center">
            <div className="text-xs text-gray-500 mb-2">{label}</div>
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-1">{sub}</div>
          </div>
        ))}
      </div>

      {/* Token optimization bar */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-300">Optimisation des tokens</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Tokens sans Ollama</span>
              <span className="text-red-400 font-semibold">{(MONTHLY_STATS.totalTokensUsed / 1000).toFixed(0)}k</span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-500/50 rounded-full w-full" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Tokens avec optimisation Ollama</span>
              <span className="text-emerald-400 font-semibold">{(MONTHLY_STATS.totalTokensOptimized / 1000).toFixed(0)}k</span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500/60 rounded-full"
                style={{ width: `${(MONTHLY_STATS.totalTokensOptimized / MONTHLY_STATS.totalTokensUsed) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Tokens économisés (→ Ollama)</span>
              <span className="text-purple-400 font-semibold">{((MONTHLY_STATS.totalTokensUsed - MONTHLY_STATS.totalTokensOptimized) / 1000).toFixed(0)}k</span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500/60 rounded-full"
                style={{ width: `${((MONTHLY_STATS.totalTokensUsed - MONTHLY_STATS.totalTokensOptimized) / MONTHLY_STATS.totalTokensUsed) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-5">
        {/* Tasks by AI */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Tâches par IA</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
                  {PIE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.85} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val) => [`${val} tâches`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {PIE_DATA.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
                  <span className="text-gray-300">{d.name}</span>
                  <span className="text-gray-500 ml-auto">{d.value} ({Math.round(d.value / total * 100)}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cost by AI */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Coût par IA (ce mois)</h3>
          <div className="space-y-3 mt-2">
            <GaugeBar value={Math.round(MONTHLY_STATS.costByAI.claude / MONTHLY_STATS.totalCostOptimized * 100)} color="bg-purple-500" label={`Claude — $${MONTHLY_STATS.costByAI.claude.toFixed(2)}`} />
            <GaugeBar value={Math.round(MONTHLY_STATS.costByAI.chatgpt / MONTHLY_STATS.totalCostOptimized * 100)} color="bg-emerald-500" label={`ChatGPT — $${MONTHLY_STATS.costByAI.chatgpt.toFixed(2)}`} />
            <GaugeBar value={0} color="bg-amber-500" label="Ollama — $0.00 (gratuit)" />
          </div>
        </div>
      </div>

      {/* Task cost breakdown */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-gray-300">Coût estimé par type de tâche</h3>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800 text-[10px] uppercase tracking-wider text-gray-600">
              <th className="text-left px-5 py-2">Tâche</th>
              <th className="text-right px-4 py-2">Si Claude</th>
              <th className="text-right px-4 py-2">Si ChatGPT</th>
              <th className="text-right px-4 py-2">Si Ollama</th>
              <th className="text-right px-4 py-2 text-emerald-600">Optimisé</th>
              <th className="text-right px-4 py-2 text-purple-600">Économie</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/40">
            {COST_ESTIMATES.map((row) => (
              <tr key={row.taskType} className="hover:bg-white/[0.02]">
                <td className="px-5 py-2.5 text-gray-300">{row.taskType}</td>
                <td className="px-4 py-2.5 text-right text-gray-400">${row.costClaude.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-right text-gray-400">${row.costChatGPT.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-right text-emerald-600">FREE</td>
                <td className="px-4 py-2.5 text-right font-semibold text-emerald-400">${row.optimizedCost.toFixed(2)}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-purple-400">
                  {row.savings > 0 ? `-$${row.savings.toFixed(2)}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
