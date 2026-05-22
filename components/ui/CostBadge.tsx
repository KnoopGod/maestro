interface Props {
  cost: '$' | '$$' | '$$$' | '$$$$' | 'FREE'
  size?: 'sm' | 'md'
}

const COST_STYLE: Record<string, string> = {
  'FREE':  'bg-emerald-900/60 text-emerald-300 border-emerald-600/40',
  '$':     'bg-green-900/60 text-green-300 border-green-600/40',
  '$$':    'bg-yellow-900/60 text-yellow-300 border-yellow-600/40',
  '$$$':   'bg-orange-900/60 text-orange-300 border-orange-600/40',
  '$$$$':  'bg-red-900/60 text-red-300 border-red-600/40',
}

export function CostBadge({ cost, size = 'sm' }: Props) {
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'
  return (
    <span className={`inline-flex items-center rounded border font-mono font-bold ${sizeClass} ${COST_STYLE[cost]}`}>
      {cost}
    </span>
  )
}
