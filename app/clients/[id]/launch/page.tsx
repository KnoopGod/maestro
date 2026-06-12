import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Rocket } from 'lucide-react'
import { getClient } from '@/lib/db/queries/clients'
import { getLaunchTunnel } from '@/lib/db/queries/launch-tunnel'
import { LaunchTunnel } from '@/components/clients/LaunchTunnel'
import { CLIENT_TYPES } from '@/types/client'

export const dynamic = 'force-dynamic'

export default async function ClientLaunchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await getClient(id)
  if (!client) notFound()

  const tunnelState = await getLaunchTunnel(id)
  const typeLabel = CLIENT_TYPES[client.type]?.label ?? client.type

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/clients/${client.id}`}
          className="inline-flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-gray-300 font-mono tracking-wider uppercase mb-4"
        >
          <ArrowLeft className="w-3 h-3" /> {client.name}
        </Link>
        <div className="flex items-center gap-4 border-b border-indigo-950/60 pb-5">
          <div className={`w-12 h-12 bg-gradient-to-br ${client.color} flex items-center justify-center text-2xl flex-shrink-0`}>
            {client.emoji}
          </div>
          <div>
            <div className="text-[9px] text-indigo-600/50 font-mono tracking-[0.3em] uppercase mb-1 flex items-center gap-2">
              <Rocket className="w-3 h-3" /> TUNNEL DE LANCEMENT
            </div>
            <h1 className="text-xl font-bold text-[#E0E3FF] tracking-wide uppercase">{client.name}</h1>
            <p className="text-[10px] text-gray-500 font-mono mt-0.5">
              {typeLabel}{client.city ? ` // ${client.city}` : ''} — 5 étapes pour des réseaux sociaux 100% opérationnels
            </p>
          </div>
        </div>
      </div>

      <LaunchTunnel clientId={client.id} initialState={tunnelState} />
    </div>
  )
}
