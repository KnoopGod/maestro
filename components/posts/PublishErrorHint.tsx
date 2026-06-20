'use client'

import Link from 'next/link'
import { ArrowRight, Wrench } from 'lucide-react'
import { getMetaErrorAction } from '@/lib/meta-error-actions'

export function PublishErrorHint({ error, clientId }: { error?: string | null; clientId?: string | null }) {
  const action = getMetaErrorAction(error, clientId)
  if (!action) return null

  const toneClass =
    action.tone === 'danger'
      ? 'border-red-700/40 bg-red-950/30 text-red-100'
      : action.tone === 'warning'
        ? 'border-amber-700/40 bg-amber-950/30 text-amber-100'
        : 'border-blue-700/40 bg-blue-950/30 text-blue-100'

  const arrowColor =
    action.tone === 'danger' ? 'text-red-400' :
    action.tone === 'warning' ? 'text-amber-400' :
    'text-blue-400'

  return (
    <div className={`mt-2 rounded-xl border p-3 text-xs ${toneClass}`}>
      <div className="flex items-start gap-2.5">
        <Wrench className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 opacity-70" />
        <div className="min-w-0 flex-1">
          <p className="leading-relaxed">{action.reason}</p>
          <Link
            href={action.href}
            className={`mt-2 inline-flex items-center gap-1.5 font-semibold hover:underline ${arrowColor} transition-colors duration-150`}
          >
            {action.label}
            <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform duration-150" />
          </Link>
        </div>
      </div>
    </div>
  )
}
