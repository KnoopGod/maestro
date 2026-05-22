'use client'
import { motion } from 'framer-motion'
import { AIModel } from '@/types'
import { StatusDot } from '@/components/ui/StatusDot'
import { GaugeBar } from '@/components/ui/GaugeBar'
import { AIBadge } from '@/components/ui/AIBadge'
import { useCommandCenterStore } from '@/store/useCommandCenterStore'
import { Check } from 'lucide-react'

interface Props {
  model: AIModel
  index: number
}

const GAUGE_COLORS: Record<string, string> = {
  claude:  'bg-purple-500',
  chatgpt: 'bg-emerald-500',
  ollama:  'bg-amber-500',
  future:  'bg-gray-600',
}

export function ModelCard({ model, index }: Props) {
  const { aiStatuses, selectedAI, setSelectedAI, simulateTimeout, resetStatus } = useCommandCenterStore()
  const status = aiStatuses[model.id]
  const isSelected = selectedAI === model.id
  const isInactive = status === 'inactive'
  const color = GAUGE_COLORS[model.id]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`rounded-2xl border p-5 flex flex-col gap-4 ${model.bgColor} ${model.borderColor}
        ${isSelected ? 'ring-2 ring-purple-500/50' : ''}
        ${isInactive ? 'opacity-60' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-bold text-white">{model.name}</span>
            <StatusDot status={status} showLabel />
          </div>
          <div className="text-xs text-gray-400 font-mono">{model.currentModel}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">{model.provider}</div>
        </div>
        <AIBadge badge={model.badge} />
      </div>

      {/* Description */}
      <p className="text-xs text-gray-400 leading-relaxed">{model.description}</p>

      {/* Use cases */}
      <div className="flex flex-wrap gap-1.5">
        {model.useCases.slice(0, 5).map((uc) => (
          <span key={uc} className="text-[10px] bg-white/5 border border-white/10 rounded-md px-2 py-0.5 text-gray-300">
            {uc}
          </span>
        ))}
        {model.useCases.length > 5 && (
          <span className="text-[10px] text-gray-500">+{model.useCases.length - 5}</span>
        )}
      </div>

      {/* Gauges */}
      {!isInactive && (
        <div className="space-y-2.5">
          <GaugeBar value={model.qualityScore} color={color} label="Qualité" height="h-1.5" />
          <GaugeBar value={model.speedScore}   color={color} label="Vitesse" height="h-1.5" />
          <GaugeBar value={model.costScore}    color="bg-emerald-600" label="Économie (↑ = gratuit)" height="h-1.5" />
        </div>
      )}

      {/* Budget bar */}
      {model.monthlyBudget && (
        <div>
          <div className="flex justify-between text-[10px] mb-1">
            <span className="text-gray-500">Budget mensuel</span>
            <span className="text-gray-300 font-semibold">
              ${model.usedBudget?.toFixed(2)} / ${model.monthlyBudget}
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all"
              style={{ width: `${((model.usedBudget ?? 0) / model.monthlyBudget) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {!isInactive && (
          <button
            onClick={() => setSelectedAI(isSelected ? null : model.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg font-medium transition-all
              ${isSelected
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
          >
            {isSelected && <Check className="w-3.5 h-3.5" />}
            {isSelected ? 'Sélectionnée' : 'Sélectionner'}
          </button>
        )}
        {!isInactive && (
          <button
            onClick={() => status === 'timeout' ? resetStatus(model.id) : simulateTimeout(model.id)}
            className="text-[10px] px-2 py-2 rounded-lg bg-gray-800 text-gray-500 hover:bg-gray-700 transition-colors"
            title={status === 'timeout' ? 'Rétablir' : 'Simuler timeout'}
          >
            {status === 'timeout' ? '✓ Reset' : '⚡ Timeout'}
          </button>
        )}
        {isInactive && (
          <div className="flex-1 text-center text-xs text-gray-600 py-2">Connexion non configurée</div>
        )}
      </div>
    </motion.div>
  )
}
