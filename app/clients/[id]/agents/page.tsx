import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Bot } from 'lucide-react'
import { getClient } from '@/lib/db/queries/clients'

export const dynamic = 'force-dynamic'

const ASSIGNED_AGENTS = [
  { id: 'social-expert',   name: 'Social Expert',   emoji: '✍️', desc: 'Captions et hashtags', active: true },
  { id: 'vision-analyzer', name: 'Vision Analyzer', emoji: '👁️', desc: 'Analyse des photos uploadées', active: true },
  { id: 'da-curator',      name: 'DA Curator',      emoji: '🎨', desc: 'Direction Artistique synthétisée', active: true },
]

export default async function ClientAgentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await getClient(id)
  if (!client) notFound()

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href={`/clients/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à {client.name}
      </Link>

      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${client.color} flex items-center justify-center text-2xl shadow-lg`}>
          {client.emoji}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-purple-400" />
            Agents assignés
          </h1>
          <p className="text-sm text-gray-400">{client.name} · {ASSIGNED_AGENTS.length} actifs</p>
        </div>
      </div>

      <div className="space-y-3">
        {ASSIGNED_AGENTS.map(agent => (
          <div key={agent.id} className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
            <div className="text-3xl">{agent.emoji}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{agent.name}</span>
                <span className="text-[10px] bg-emerald-900/40 text-emerald-400 border border-emerald-800/40 rounded-full px-2 py-0.5">● Actif</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{agent.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-purple-950/20 border border-purple-700/30 rounded-2xl p-4 text-sm text-gray-300">
        💡 Tous les agents actifs sont automatiquement utilisés quand tu crées un post pour ce client dans le <Link href={`/studio?client=${id}`} className="text-purple-400 hover:underline">Studio</Link>.
      </div>

      <Link
        href={`/agents?client=${id}`}
        className="text-sm text-purple-400 hover:underline"
      >
        Voir l&apos;activité agents pour {client.name} →
      </Link>
    </div>
  )
}
