'use client'
import { motion } from 'framer-motion'
import { AIModel } from '@/types'
import { AIStatus } from '@/types'
import { StatusDot } from '@/components/ui/StatusDot'
import { GaugeBar } from '@/components/ui/GaugeBar'
import { AIBadge } from '@/components/ui/AIBadge'
import { useCommandCenterStore } from '@/store/useCommandCenterStore'

interface Props {
  model: AIModel
}

const GAUGE_COLORS: Record<string, string> = {
  claude:  'bg-purple-500',
  chatgpt: 'bg-emerald-500',
  ollama:  'bg-amber-500',
  future:  'bg-gray-600',
}

export function StatusCard({ model }: Props) {
  const { aiStatuses, simulateTimeout, resetStatus } = useCommandCenterStore()
  const status = aiStatuses[model.id]
  const color = GAUGE_COLORS[model.id]
  const isInactive = status === 'inactive'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 flex flex-col gap-3 ${model.bgColor} ${model.borderColor} ${isInactive ? 'opacity-50' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-white">{model.name}</span>
            <StatusDot status={status} />
          </div>
          <div className="text-xs text-gray-400">{model.currentModel}</div>
        </div>
        <AIBadge badge={model.badge} />
      </div>

      {/* Gauges */}
      {!isInactive && (
        <div className="space-y-2">
          <GaugeBar value={model.qualityScore} color={color} label="Qualité" />
          <GaugeBar value={model.speedScore}   color={color} label="Vitesse" />
          <GaugeBar value={model.costScore}    color="bg-emerald-600" label="Économie" />
        </div>
      )}

      {/* Budget */}
      {model.monthlyBudget && (
        <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs">
          <span className="text-gray-400">Budget mensuel</span>
          <span className="font-semibold text-white">
            ${model.usedBudget?.toFixed(2)} <span className="text-gray-500">/ ${model.monthlyBudget}</span>
          </span>
        </div>
      )}

      {/* Simulate button */}
      {!isInactive && (
        <div className="flex gap-2 pt-1">
          {status !== 'timeout' ? (
            <button
              onClick={() => simulateTimeout(model.id)}
              className="text-[10px] px-2 py-1 rounded bg-red-900/40 text-red-400 border border-red-800/40 hover:bg-red-900/60 transition-colors"
            >
              Simuler timeout
            </button>
          ) : (
            <button
              onClick={() => resetStatus(model.id)}
              className="text-[10px] px-2 py-1 rounded bg-green-900/40 text-green-400 border border-green-800/40 hover:bg-green-900/60 transition-colors"
            >
              Rétablir
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}
