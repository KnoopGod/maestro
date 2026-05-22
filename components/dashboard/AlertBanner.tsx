import { MOCK_ALERTS } from '@/lib/mock-data/cost-estimates'
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react'

const ALERT_STYLE = {
  warning: { icon: AlertTriangle, bg: 'bg-orange-950/40', border: 'border-orange-700/40', text: 'text-orange-300' },
  error:   { icon: XCircle,       bg: 'bg-red-950/40',    border: 'border-red-700/40',    text: 'text-red-300' },
  info:    { icon: Info,          bg: 'bg-blue-950/40',   border: 'border-blue-700/40',   text: 'text-blue-300' },
  success: { icon: CheckCircle,   bg: 'bg-green-950/40',  border: 'border-green-700/40',  text: 'text-green-300' },
}

export function AlertBanner() {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-300">Alertes</h3>
      {MOCK_ALERTS.map((alert) => {
        const { icon: Icon, bg, border, text } = ALERT_STYLE[alert.type]
        return (
          <div key={alert.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${bg} ${border}`}>
            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${text}`} />
            <span className={`text-xs ${text}`}>{alert.message}</span>
            <span className="text-[10px] text-gray-600 ml-auto">{alert.timestamp}</span>
          </div>
        )
      })}
    </div>
  )
}
