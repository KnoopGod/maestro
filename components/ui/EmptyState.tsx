import type React from 'react'
import Link from 'next/link'

interface EmptyStateProps {
  icon: React.ElementType
  title: string
  description?: string
  cta?: { label: string; href: string; icon?: React.ElementType }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, cta, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-14 px-6 bg-gray-900/20 border border-dashed border-gray-800 rounded-2xl ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-gray-900/60 border border-gray-800 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-gray-600" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-gray-400">{title}</p>
      {description && <p className="text-xs text-gray-600 mt-1 max-w-xs">{description}</p>}
      {cta && (
        <Link
          href={cta.href}
          className="inline-flex items-center gap-1.5 mt-4 text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          {cta.icon && <cta.icon className="w-3.5 h-3.5" aria-hidden="true" />}
          {cta.label}
        </Link>
      )}
    </div>
  )
}
