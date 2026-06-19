'use client'
import { motion } from 'framer-motion'
import { AIStatus } from '@/types'

const STATUS_CONFIG: Record<AIStatus, { color: string; label: string; pulse: boolean }> = {
  active:   { color: 'bg-emerald-400', label: 'Actif',    pulse: true },
  limited:  { color: 'bg-amber-400',   label: 'Limité',   pulse: false },
  timeout:  { color: 'bg-red-400',     label: 'Timeout',  pulse: false },
  inactive: { color: 'bg-gray-600',    label: 'Inactif',  pulse: false },
}

interface Props {
  status: AIStatus
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const SIZE = { sm: 'w-2 h-2', md: 'w-3 h-3', lg: 'w-4 h-4' }

export function StatusDot({ status, showLabel = false, size = 'md' }: Props) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className="flex items-center gap-2">
      <span className="relative flex">
        {cfg.pulse && (
          <motion.span
            className={`absolute inline-flex rounded-full ${cfg.color} opacity-60 ${SIZE[size]}`}
            animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        <span className={`relative inline-flex rounded-full ${cfg.color} ${SIZE[size]}`} />
      </span>
      {showLabel && (
        <span className="text-xs font-medium text-gray-300 transition-colors">{cfg.label}</span>
      )}
    </span>
  )
}
