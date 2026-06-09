interface Props {
  badge: 'premium' | 'creative' | 'local' | 'free' | 'draft' | 'future'
}

const BADGE_STYLE: Record<string, string> = {
  premium:  'bg-purple-900/60 text-purple-300 border-purple-600/40',
  creative: 'bg-emerald-900/60 text-emerald-300 border-emerald-600/40',
  local:    'bg-amber-900/60 text-amber-300 border-amber-600/40',
  free:     'bg-green-900/60 text-green-300 border-green-600/40',
  draft:    'bg-blue-900/60 text-blue-300 border-blue-600/40',
  future:   'bg-gray-800/60 text-gray-400 border-gray-600/40',
}

const BADGE_LABEL: Record<string, string> = {
  premium:  '👑 Premium',
  creative: '🎨 Créatif',
  local:    '🏠 Local',
  free:     '✓ Gratuit',
  draft:    '📝 Brouillon',
  future:   '◎ Futur',
}

export function AIBadge({ badge }: Props) {
  return (
    <span className={`inline-flex items-center rounded border text-[11px] font-semibold px-2 py-0.5 ${BADGE_STYLE[badge]}`}>
      {BADGE_LABEL[badge]}
    </span>
  )
}
