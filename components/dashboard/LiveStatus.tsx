'use client'
import { useEffect, useState } from 'react'
import { StatusDot } from '@/components/ui/StatusDot'
import { AIStatus } from '@/types'
import { RefreshCw } from 'lucide-react'

interface ServiceStatus {
  status: string
  models?: string[]
  model?: string
  host?: string
}

interface StatusData {
  timestamp: string
  services: {
    ollama: ServiceStatus
    claude: ServiceStatus
    chatgpt: ServiceStatus
  }
}

function toAIStatus(s: string): AIStatus {
  if (s === 'active' || s === 'configured') return 'active'
  if (s === 'missing_key') return 'limited'
  return 'inactive'
}

const SERVICE_STYLE = {
  ollama:  { label: 'Ollama Local', color: '#F59E0B', bg: 'bg-amber-950/40',   border: 'border-amber-700/30'  },
  claude:  { label: 'Claude',       color: '#7C3AED', bg: 'bg-purple-950/40',  border: 'border-purple-700/30' },
  chatgpt: { label: 'ChatGPT',      color: '#10A37F', bg: 'bg-emerald-950/40', border: 'border-emerald-700/30'},
}

export function LiveStatus() {
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<string>('')

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/status')
      const json = await res.json()
      setData(json)
      setLastRefresh(new Date().toLocaleTimeString('fr-FR'))
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(fetchStatus, 0)
    const interval = setInterval(fetchStatus, 30000) // refresh toutes les 30s
    return () => {
      window.clearTimeout(timer)
      clearInterval(interval)
    }
  }, [])

  if (!data) return null

  const services = [
    { key: 'claude',  ...SERVICE_STYLE.claude,  data: data.services.claude  },
    { key: 'chatgpt', ...SERVICE_STYLE.chatgpt, data: data.services.chatgpt },
    { key: 'ollama',  ...SERVICE_STYLE.ollama,  data: data.services.ollama  },
  ]

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-300">Statut en temps réel</h3>
        <button
          onClick={fetchStatus}
          className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          {lastRefresh}
        </button>
      </div>

      <div className="space-y-2.5">
        {services.map(({ key, label, bg, border, data: svc }) => {
          const status = toAIStatus(svc.status)
          const isConfigured = svc.status === 'active' || svc.status === 'configured'

          return (
            <div key={key} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${bg} ${border}`}>
              <StatusDot status={status} size="md" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-200">{label}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {key === 'ollama' && svc.models?.length
                    ? `${svc.models.join(', ')} · ${svc.host}`
                    : svc.model
                  }
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md
                ${isConfigured
                  ? 'bg-green-900/40 text-green-400 border border-green-800/40'
                  : 'bg-orange-900/40 text-orange-400 border border-orange-800/40'
                }`}>
                {isConfigured ? 'Connectée' : 'Clé manquante'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
