import Link from 'next/link'
import { CLIENT_TYPES, CLIENT_STATUS, type ClientWithStats } from '@/types/client'
import { DeleteClientButton } from './DeleteClientButton'

export function ClientCard({ client }: { client: ClientWithStats }) {
  const typeCfg = CLIENT_TYPES[client.type]
  const statusCfg = CLIENT_STATUS[client.status]

  return (
    <div className="hud-corners bg-gray-900/60 border border-gray-800 hover:border-indigo-700/60 hover:shadow-[0_0_24px_rgba(99,102,241,0.12)] transition-all duration-200 group p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <Link href={`/clients/${client.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <div className={`w-10 h-10 bg-gradient-to-br ${client.color} flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}>
            {client.emoji}
          </div>
          <div className="min-w-0">
            <div className="text-[8px] text-indigo-600/60 font-mono tracking-[0.25em] uppercase mb-0.5">{typeCfg.label}{client.city ? ` // ${client.city}` : ''}</div>
            <div className="truncate text-sm font-medium text-[#E0E3FF] group-hover:text-indigo-300 transition-colors tracking-wide">{client.name}</div>
          </div>
        </Link>
        <div className="flex flex-shrink-0 items-center gap-2">
          <span className={`text-[8px] border font-mono tracking-widest px-2 py-0.5 uppercase ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
          <DeleteClientButton clientId={client.id} clientName={client.name} compact />
        </div>
      </div>

      <Link href={`/clients/${client.id}`} className="grid grid-cols-3 border-t border-gray-800 pt-3 divide-x divide-gray-800">
        <div className="px-2 text-center">
          <div className="text-sm font-bold text-[#E0E3FF] font-mono">{client.postsThisMonth}</div>
          <div className="text-[8px] text-indigo-600/50 font-mono tracking-[0.2em] uppercase mt-0.5">POSTS</div>
        </div>
        <div className="px-2 text-center">
          <div className="text-sm font-bold text-emerald-400 font-mono">{client.engagement}%</div>
          <div className="text-[8px] text-indigo-600/50 font-mono tracking-[0.2em] uppercase mt-0.5">ENGAGE</div>
        </div>
        <div className="px-2 text-center">
          <div className="text-sm font-bold text-indigo-400 font-mono">{client.connectedPlatforms}</div>
          <div className="text-[8px] text-indigo-600/50 font-mono tracking-[0.2em] uppercase mt-0.5">PLATF.</div>
        </div>
      </Link>
    </div>
  )
}
