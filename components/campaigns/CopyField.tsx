'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

/**
 * Champ de créa prêt à copier vers Ads Manager / Google Ads.
 * Affiche le compteur de caractères vs limite régie (vert = OK, rouge = dépassé).
 */
export function CopyField({
  label,
  value,
  limit,
  multiline = false,
}: {
  label: string
  value: string
  /** Limite de caractères de la régie — omis si pas de limite. */
  limit?: number
  multiline?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const overLimit = limit !== undefined && value.length > limit

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard indisponible (HTTP non sécurisé) — pas de feedback
    }
  }

  return (
    <div className="group/field">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] uppercase tracking-wider text-gray-500">{label}</span>
        <div className="flex items-center gap-2">
          {limit !== undefined && (
            <span className={`text-[11px] font-mono ${overLimit ? 'text-red-400' : 'text-emerald-400/80'}`}>
              {value.length}/{limit}
            </span>
          )}
          <button
            type="button"
            onClick={copy}
            title={`Copier ${label.toLowerCase()}`}
            className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border border-gray-700 text-gray-400 hover:border-purple-500/60 hover:text-purple-300 transition-all duration-150 active:scale-[0.98]"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
      </div>
      <div className={`bg-gray-950/60 border rounded-lg px-3 py-2 text-sm text-gray-200 ${overLimit ? 'border-red-800/60' : 'border-gray-800'} ${multiline ? 'whitespace-pre-wrap' : 'truncate'}`}>
        {value || <span className="text-gray-600">—</span>}
      </div>
    </div>
  )
}

/** Liste copiable d'un bloc (mots-clés, titres) — copie tout en un clic, un élément par ligne. */
export function CopyList({
  label,
  items,
  limit,
}: {
  label: string
  items: string[]
  /** Limite de caractères par élément. */
  limit?: number
}) {
  const [copied, setCopied] = useState(false)

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(items.join('\n'))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard indisponible — silencieux
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] uppercase tracking-wider text-gray-500">{label} · {items.length}</span>
        <button
          type="button"
          onClick={copyAll}
          title={`Copier tous les éléments (${items.length}), un par ligne`}
          className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border border-gray-700 text-gray-400 hover:border-purple-500/60 hover:text-purple-300 transition-all duration-150 active:scale-[0.98]"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copié' : 'Tout copier'}
        </button>
      </div>
      <ul className="bg-gray-950/60 border border-gray-800 rounded-lg divide-y divide-gray-800/60">
        {items.map((item, i) => {
          const over = limit !== undefined && item.length > limit
          return (
            <li key={`${item}-${i}`} className="flex items-center justify-between gap-3 px-3 py-1.5">
              <span className="text-sm text-gray-200 truncate">{item}</span>
              {limit !== undefined && (
                <span className={`text-[11px] font-mono flex-shrink-0 ${over ? 'text-red-400' : 'text-gray-600'}`}>
                  {item.length}/{limit}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
