import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Sparkles, CalendarDays, BarChart3, Settings2, Bot, Edit3, FolderOpen } from 'lucide-react'
import { getClient } from '@/lib/db/queries/clients'
import { listClientAssets, getVisualIdentity } from '@/lib/db/queries/assets'
import { CLIENT_TYPES, CLIENT_STATUS } from '@/types/client'
import { DeleteClientButton } from '@/components/clients/DeleteClientButton'

export const dynamic = 'force-dynamic'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await getClient(id)
  if (!client) notFound()

  const [assets, identity] = await Promise.all([
    listClientAssets(id),
    getVisualIdentity(id),
  ])

  const typeCfg = CLIENT_TYPES[client.type]
  const statusCfg = CLIENT_STATUS[client.status]

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Breadcrumb */}
      <Link href="/clients" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Retour aux clients
      </Link>

      {/* Header */}
      <div className="flex items-start gap-5 pb-6 border-b border-gray-800">
        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${client.color} flex items-center justify-center text-4xl shadow-lg flex-shrink-0`}>
          {client.emoji}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-white">{client.name}</h1>
            <span className={`text-[11px] border rounded-full px-2 py-0.5 ${statusCfg.color}`}>
              ● {statusCfg.label}
            </span>
          </div>
          <p className="text-sm text-gray-400">
            {typeCfg.label}{client.city ? ` · ${client.city}` : ''}
          </p>
          {client.description && (
            <p className="text-sm text-gray-500 mt-2 max-w-2xl">{client.description}</p>
          )}
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Link
            href={`/studio?client=${client.id}`}
            className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Créer un post
          </Link>
          <Link
            href={`/clients/${client.id}/edit`}
            className="px-3 py-2 rounded-lg border border-gray-800 hover:bg-gray-800 text-gray-300 text-sm flex items-center gap-1.5 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Éditer
          </Link>
          <DeleteClientButton clientId={client.id} clientName={client.name} />
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-5 gap-3">
        <Link href={`/clients/${client.id}/library`} className="bg-gradient-to-br from-purple-950/40 to-pink-950/30 border border-purple-700/30 rounded-xl p-4 hover:border-purple-500/50 transition-all flex items-center gap-3 group">
          <FolderOpen className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-white">Bibliothèque</div>
            <div className="text-[11px] text-gray-500">{assets.length} éléments{identity?.stylePrompt ? ' · DA' : ''}</div>
          </div>
        </Link>

        <Link href={`/clients/${client.id}/agents`} className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 hover:border-purple-700/50 transition-all flex items-center gap-3 group">
          <Bot className="w-5 h-5 text-purple-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-white">Agents</div>
            <div className="text-[11px] text-gray-500">3 actifs</div>
          </div>
        </Link>

        <Link href={`/plan?client=${client.id}`} className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 hover:border-purple-700/50 transition-all flex items-center gap-3 group">
          <CalendarDays className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-white">Calendrier</div>
            <div className="text-[11px] text-gray-500">8 posts prog.</div>
          </div>
        </Link>

        <Link href={`/analytics?client=${client.id}`} className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 hover:border-purple-700/50 transition-all flex items-center gap-3 group">
          <BarChart3 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-white">Analytics</div>
            <div className="text-[11px] text-gray-500">5.2% engagement</div>
          </div>
        </Link>

        <Link href={`/clients/${client.id}/connections`} className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 hover:border-purple-700/50 transition-all flex items-center gap-3 group">
          <Settings2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <div>
            <div className="text-sm font-medium text-white">Connexions</div>
            <div className="text-[11px] text-gray-500">Meta · IG · TikTok</div>
          </div>
        </Link>
      </div>

      {/* DA Banner if identity exists */}
      {identity && identity.stylePrompt && (
        <div className="bg-gradient-to-r from-purple-950/40 to-pink-950/30 border border-purple-700/30 rounded-2xl p-5 flex items-start gap-4">
          <div className="text-3xl">✨</div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white flex items-center gap-2 mb-1">
              Direction Artistique active
              <span className="text-[10px] bg-emerald-900/40 text-emerald-400 border border-emerald-800/40 rounded-full px-2 py-0.5">
                injectée dans les générations
              </span>
            </div>
            <p className="text-sm text-gray-300">{identity.visualSummary}</p>
            <div className="flex items-center gap-2 mt-2">
              {identity.palette.slice(0, 5).map((c, i) => (
                <div key={i} className="w-5 h-5 rounded-md border border-gray-700" style={{ backgroundColor: c }} title={c} />
              ))}
              <span className="text-[10px] text-purple-300 ml-2">
                {identity.styleKeywords.slice(0, 3).join(' · ')}
              </span>
            </div>
          </div>
          <Link
            href={`/clients/${client.id}/library`}
            className="px-3 py-1.5 text-xs rounded-lg border border-purple-700/40 text-purple-300 hover:bg-purple-900/30"
          >
            Gérer →
          </Link>
        </div>
      )}

      {/* Brand Voice */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            🎯 Identité de marque
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">Ton</dt>
              <dd className="text-gray-200">{client.brandVoiceTone || <span className="text-gray-600 italic">Non défini</span>}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">Mots-clés</dt>
              <dd className="text-gray-200">
                {client.brandVoiceKeywords
                  ? client.brandVoiceKeywords.split(',').map((k, i) => (
                      <span key={i} className="inline-block mr-1.5 mb-1 px-2 py-0.5 rounded bg-purple-900/30 border border-purple-700/30 text-purple-300 text-xs">
                        {k.trim()}
                      </span>
                    ))
                  : <span className="text-gray-600 italic">Non définis</span>
                }
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">À éviter</dt>
              <dd className="text-gray-400 text-xs italic">
                {client.brandVoiceAvoid || <span className="text-gray-600">Aucun</span>}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">Langues</dt>
              <dd className="flex gap-1.5">
                {client.languages.map(l => (
                  <span key={l} className="px-2 py-0.5 rounded bg-blue-900/30 border border-blue-700/30 text-blue-300 text-xs uppercase">
                    {l}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </div>

        {/* Connected platforms placeholder */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            🔌 Plateformes connectées
          </h2>
          <div className="space-y-2">
            {[
              { name: 'Instagram', emoji: '📷', connected: false },
              { name: 'Facebook',  emoji: '👍', connected: false },
              { name: 'TikTok',    emoji: '🎵', connected: false },
              { name: 'Google Business', emoji: '📍', connected: false },
            ].map(p => (
              <div key={p.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-950/40 border border-gray-800">
                <span className="text-lg">{p.emoji}</span>
                <span className="text-sm text-gray-300 flex-1">{p.name}</span>
                <button className="text-xs px-2.5 py-1 rounded-lg border border-purple-700/40 text-purple-300 hover:bg-purple-900/30 transition-colors">
                  Connecter
                </button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-600 mt-3">
            La connexion OAuth des comptes sociaux sera disponible bientôt.
          </p>
        </div>
      </div>

      {/* Recent activity placeholder */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3">📊 Activité récente</h2>
        <div className="text-center py-8 text-gray-500 text-sm">
          Pas encore de posts publiés pour ce client.
          <div className="mt-2">
            <Link href={`/studio?client=${client.id}`} className="inline-flex items-center gap-1.5 text-purple-400 hover:underline">
              <Sparkles className="w-4 h-4" />
              Créer le premier post
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
