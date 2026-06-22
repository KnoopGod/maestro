export const THEME_ACCENTS = [
  {
    id: 'indigo',
    label: 'Indigo',
    description: 'Maestro classique',
    color: '#6366f1',
  },
  {
    id: 'cyan',
    label: 'Cyan',
    description: 'Technique et lumineux',
    color: '#06b6d4',
  },
  {
    id: 'emerald',
    label: 'Émeraude',
    description: 'Croissance et performance',
    color: '#10b981',
  },
  {
    id: 'amber',
    label: 'Ambre',
    description: 'Chaleureux et premium',
    color: '#f59e0b',
  },
  {
    id: 'rose',
    label: 'Rose',
    description: 'Créatif et visuel',
    color: '#f43f5e',
  },
] as const

export type ThemeAccent = typeof THEME_ACCENTS[number]['id']

export const DEFAULT_THEME_ACCENT: ThemeAccent = 'indigo'
export const THEME_STORAGE_KEY = 'maestro-interface-accent'

export function isThemeAccent(value: string | null): value is ThemeAccent {
  return THEME_ACCENTS.some(option => option.id === value)
}
