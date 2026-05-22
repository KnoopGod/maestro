import Link from 'next/link'
import { CLIENT_TYPES, CLIENT_STATUS, type ClientWithStats } from '@/types/client'

export function ClientCard({ client }: { client: ClientWithStats }) {
  const typeCfg = CLIENT_TYPES[client.type]
  const statusCfg = CLIENT_STATUS[client.status]

  return (
    <Link
      href={`/clients/${client.id}`}
      className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 hover:border-purple-700/50 transition-all group block"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${client.color} flex items-center justify-center text-2xl shadow-lg`}>
          {client.emoji}
        </div>
        <span className={`text-[10px] border rounded-full px-2 py-0.5 ${statusCfg.color}`}>
          ● {statusCfg.label}
        </span>
      </div>

      <div className="font-semibold text-white group-hover:text-purple-300 transition-colors">
        {client.name}
      </div>
      <div className="text-xs text-gray-500">
        {typeCfg.label}{client.city ? ` · ${client.city}` : ''}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-sm font-bold text-white">{client.postsThisMonth}</div>
          <div className="text-[10px] text-gray-500">posts/mois</div>
        </div>
        <div>
          <div className="text-sm font-bold text-emerald-400">{client.engagement}%</div>
          <div className="text-[10px] text-gray-500">engagement</div>
        </div>
        <div>
          <div className="text-sm font-bold text-purple-400">{client.agentsCount}</div>
          <div className="text-[10px] text-gray-500">agents</div>
        </div>
      </div>
    </Link>
  )
}
