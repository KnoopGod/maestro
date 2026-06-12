'use client'
import { useState } from 'react'
import { useCommandCenterStore } from '@/store/useCommandCenterStore'
import { getAIForTask, getModeConfig } from '@/lib/mode-config'
import { TASKS } from '@/lib/mock-data/tasks'
import { CostBadge } from '@/components/ui/CostBadge'
import { TaskCategory, AIProvider } from '@/types'

const AI_LABEL: Record<AIProvider, { label: string; color: string; dot: string }> = {
  claude:  { label: 'Claude',       color: 'text-purple-300', dot: 'bg-purple-500' },
  chatgpt: { label: 'ChatGPT',      color: 'text-emerald-300', dot: 'bg-emerald-500' },
  ollama:  { label: 'Ollama Local', color: 'text-amber-300', dot: 'bg-amber-500' },
  future:  { label: 'À définir',    color: 'text-gray-400', dot: 'bg-gray-600' },
}

const QUALITY_DOTS = (n: number) =>
  Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < n ? 'bg-purple-400' : 'bg-gray-700'}`} />
  ))

const RISK_STYLE = {
  low:    'text-green-400 bg-green-900/30 border-green-800/40',
  medium: 'text-orange-400 bg-orange-900/30 border-orange-800/40',
  high:   'text-red-400 bg-red-900/30 border-red-800/40',
}

const CATEGORY_LABEL: Record<TaskCategory, string> = {
  strategy: 'Stratégie', code: 'Code', image: 'Image', video: 'Vidéo',
  writing: 'Rédaction', seo: 'SEO', ads: 'Publicité',
  design: 'Design', automation: 'Automation', validation: 'Validation',
}

export default function TaskRouterPage() {
  const { activeMode } = useCommandCenterStore()
  const modeConfig = getModeConfig(activeMode)
  const [overrides, setOverrides] = useState<Record<string, AIProvider>>({})
  const [filter, setFilter] = useState<TaskCategory | 'all'>('all')

  const filtered = filter === 'all' ? TASKS : TASKS.filter(t => t.category === filter)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Task Router</h1>
          <p className="text-sm text-gray-500 mt-0.5">Quelle IA pour quelle tâche — selon le mode actif</p>
        </div>
        <div className="flex items-center gap-2 bg-purple-900/30 border border-purple-700/30 rounded-lg px-3 py-2 text-sm">
          <span>{modeConfig.icon}</span>
          <span className="text-purple-300 font-medium">{modeConfig.label}</span>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {(['all', ...Object.keys(CATEGORY_LABEL)] as (TaskCategory | 'all')[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all
              ${filter === cat ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            {cat === 'all' ? 'Toutes' : CATEGORY_LABEL[cat as TaskCategory]}
          </button>
        ))}
      </div>

      {/* Matrix */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-[11px] uppercase tracking-wider text-gray-500">
              <th className="text-left px-4 py-3">Tâche</th>
              <th className="text-left px-4 py-3">IA recommandée</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Raison</th>
              <th className="text-left px-4 py-3">Qualité</th>
              <th className="text-left px-4 py-3">Coût</th>
              <th className="text-left px-4 py-3">Risque</th>
              <th className="text-left px-4 py-3">Override</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {filtered.map((task) => {
              const routed = overrides[task.id] ?? getAIForTask(task.category, activeMode)
              const ai = AI_LABEL[routed]
              const isOverridden = !!overrides[task.id]

              return (
                <tr key={task.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-200">{task.label}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{CATEGORY_LABEL[task.category]}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${ai.dot}`} />
                      <span className={`font-semibold ${ai.color} ${isOverridden ? 'underline decoration-dashed decoration-gray-600' : ''}`}>
                        {ai.label}
                      </span>
                      {isOverridden && <span className="text-[10px] text-gray-600">(manuel)</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-gray-400">{task.reason}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-0.5">{QUALITY_DOTS(task.quality)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <CostBadge cost={task.cost} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${RISK_STYLE[task.risk]}`}>
                      {task.risk === 'low' ? 'Faible' : task.risk === 'medium' ? 'Moyen' : 'Élevé'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={overrides[task.id] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value as AIProvider
                        if (!val) {
                          const next = { ...overrides }
                          delete next[task.id]
                          setOverrides(next)
                        } else {
                          setOverrides({ ...overrides, [task.id]: val })
                        }
                      }}
                      className="text-[11px] bg-gray-800 border border-gray-700 rounded-md px-2 py-1 text-gray-300 cursor-pointer"
                    >
                      <option value="">Auto</option>
                      <option value="claude">Claude</option>
                      <option value="chatgpt">ChatGPT</option>
                      <option value="ollama">Ollama</option>
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
