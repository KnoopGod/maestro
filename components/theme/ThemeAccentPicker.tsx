'use client'

import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DEFAULT_THEME_ACCENT, THEME_ACCENTS, THEME_STORAGE_KEY, isThemeAccent, type ThemeAccent } from './theme-options'

export function ThemeAccentPicker() {
  const [selected, setSelected] = useState<ThemeAccent>(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME_ACCENT
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isThemeAccent(stored) ? stored : DEFAULT_THEME_ACCENT
  })

  useEffect(() => {
    document.documentElement.dataset.accent = selected
    localStorage.setItem(THEME_STORAGE_KEY, selected)
  }, [selected])

  function selectAccent(accent: ThemeAccent) {
    setSelected(accent)
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {THEME_ACCENTS.map(option => {
        const active = selected === option.id
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => selectAccent(option.id)}
            className={`group flex items-center gap-4 border bg-gray-900/55 p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-gray-900/80 ${
              active ? 'theme-accent-border theme-accent-soft' : 'border-gray-800'
            }`}
            aria-pressed={active}
          >
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 shadow-lg"
              style={{ backgroundColor: option.color, boxShadow: `0 0 28px ${option.color}55` }}
            >
              {active ? <Check className="h-5 w-5 text-white" /> : null}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold uppercase tracking-[0.18em] text-[#E0E3FF]">{option.label}</span>
              <span className="mt-1 block text-[11px] leading-relaxed text-gray-500">{option.description}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
