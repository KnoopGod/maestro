'use client'
import { motion } from 'framer-motion'

interface Props {
  value: number       // 0-100
  color?: string
  label?: string
  showValue?: boolean
  height?: string
}

export function GaugeBar({ value, color = 'bg-purple-500', label, showValue = true, height = 'h-2' }: Props) {
  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between mb-1">
          {label && <span className="text-xs text-gray-400">{label}</span>}
          {showValue && <span className="text-xs font-semibold text-gray-300">{value}%</span>}
        </div>
      )}
      <div className={`w-full bg-gray-800 rounded-full ${height} overflow-hidden`}>
        <motion.div
          className={`${height} rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
