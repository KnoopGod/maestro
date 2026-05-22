import { WORK_SESSIONS } from '@/lib/mock-data/work-memory'
import { CheckCircle, Clock, Pause } from 'lucide-react'

const AI_COLOR: Record<string, string> = {
  claude:  'text-purple-400',
  chatgpt: 'text-emerald-400',
  ollama:  'text-amber-400',
}

const STATUS_ICON = {
  completed:   { icon: CheckCircle, color: 'text-green-400' },
  active:      { icon: Clock,       color: 'text-blue-400' },
  paused:      { icon: Pause,       color: 'text-orange-400' },
}

export function RecentTasksFeed() {
  const recent = WORK_SESSIONS.slice(0, 5)

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">Dernières sessions</h3>
      <div className="space-y-3">
        {recent.map((session) => {
          const { icon: Icon, color } = STATUS_ICON[session.status]
          return (
            <div key={session.id} className="flex items-start gap-3">
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${color}`} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-200 truncate">{session.mission}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-500">{session.date}</span>
                  <span className="text-[10px] text-gray-600">•</span>
                  {session.aiSequence.map((ai, i) => (
                    <span key={i} className={`text-[10px] font-semibold ${AI_COLOR[ai] ?? 'text-gray-400'}`}>
                      {ai.charAt(0).toUpperCase() + ai.slice(1)}
                    </span>
                  )).reduce((acc, el, i) => i === 0 ? [el] : [...acc, <span key={`sep${i}`} className="text-[10px] text-gray-700">→</span>, el], [] as React.ReactNode[])}
                </div>
              </div>
              <div className="text-[10px] text-gray-500 flex-shrink-0">
                ${session.estimatedCost.toFixed(2)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
