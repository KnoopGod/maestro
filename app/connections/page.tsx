import Link from 'next/link'
import { CheckCircle2, Circle, Plug, ExternalLink } from 'lucide-react'
import { CONNECTIONS } from '@/lib/connection-registry'

export const dynamic = 'force-dynamic'

const STATUS_INFO = {
  required:    { label: 'MVP requis',    color: 'bg-red-900/30 text-red-300 border-red-700/40' },
  recommended: { label: 'Recommandé',    color: 'bg-amber-900/30 text-amber-300 border-amber-700/40' },
  later:       { label: 'Plus tard',     color: 'bg-gray-800 text-gray-400 border-gray-700' },
}

const SCOPE_INFO = {
  'global':     { label: 'Global', color: 'bg-purple-900/30 text-purple-300 border-purple-700/40' },
  'per-client': { label: 'Par client', color: 'bg-blue-900/30 text-blue-300 border-blue-700/40' },
}

export default function ConnectionsPage() {
  const configured = CONNECTIONS.filter(c => c.isConfigured?.()).length
  const required = CONNECTIONS.filter(c => c.status === 'required')
  const requiredOk = required.filter(c => c.isConfigured?.()).length

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Plug className="w-7 h-7 text-purple-400" />
            Connexions
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Le tunnel API pour activer Maestro · {configured}/{CONNECTIONS.length} configurées
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">MVP requis</div>
          <div className="text-lg font-semibold text-white">
            <span className={requiredOk === required.length ? 'text-emerald-400' : 'text-amber-400'}>
              {requiredOk}
            </span>
            <span className="text-gray-500">/{required.length}</span>
          </div>
        </div>
      </div>

      {/* Explainer */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-purple-950/30 border border-purple-700/30 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-1">🌐 Connexions globales</h3>
          <p className="text-xs text-gray-400">
            Anthropic, OpenAI, URL publique : configurées une fois dans <code className="px-1 py-0.5 rounded bg-purple-950/50 text-purple-300">.env.local</code>.
            Tous les clients réutilisent ces moteurs.
          </p>
        </div>
        <div className="bg-blue-950/30 border border-blue-700/30 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-1">👤 Connexions par client</h3>
          <p className="text-xs text-gray-400">
            Page Facebook, Instagram Business, library : refaites à chaque onboarding via{' '}
            <code className="px-1 py-0.5 rounded bg-blue-950/50 text-blue-300">/clients/[id]/connections</code>.
          </p>
        </div>
      </div>

      {/* Quick-flow recap */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3">📋 Ordre recommandé</h2>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2 text-xs">
          {CONNECTIONS.map((c, i) => (
            <div key={c.id} className="bg-gray-950/40 border border-gray-800 rounded-lg p-2.5">
              <div className="text-[10px] text-purple-400 mb-1">ÉTAPE {i + 1}</div>
              <div className="text-sm font-medium text-white flex items-center gap-1.5">
                <span>{c.emoji}</span>
                <span className="truncate">{c.name.split(' · ')[0]}</span>
              </div>
              <div className="mt-1.5">
                {c.isConfigured?.() ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-gray-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {CONNECTIONS.map(connection => {
          const isOk = connection.isConfigured?.()
          return (
            <article
              key={connection.id}
              className={`rounded-2xl border p-5 ${
                isOk
                  ? 'bg-emerald-950/15 border-emerald-700/30'
                  : 'bg-gray-900/40 border-gray-800'
              }`}
            >
              <header className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="text-3xl flex-shrink-0">{connection.emoji}</div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white">{connection.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{connection.unlocks}</p>
                  </div>
                </div>
                {isOk ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-600 flex-shrink-0" />
                )}
              </header>

              <div className="flex gap-2 flex-wrap mb-3">
                <span className={`text-[10px] border rounded-full px-2 py-0.5 ${STATUS_INFO[connection.status].color}`}>
                  {STATUS_INFO[connection.status].label}
                </span>
                <span className={`text-[10px] border rounded-full px-2 py-0.5 ${SCOPE_INFO[connection.scope].color}`}>
                  {SCOPE_INFO[connection.scope].label}
                </span>
              </div>

              <div className="mb-3">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Variables .env.local</div>
                <div className="flex gap-1.5 flex-wrap">
                  {connection.envVars.map(env => (
                    <code key={env} className="text-[11px] px-1.5 py-0.5 rounded bg-gray-950 border border-gray-800 text-gray-300">
                      {env}
                    </code>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Guide</div>
                <ol className="space-y-1">
                  {connection.guide.map((step, i) => (
                    <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                      <span className="text-purple-400 font-semibold flex-shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Test de validation</div>
                <p className="text-xs text-gray-400 italic">{connection.test}</p>
              </div>
            </article>
          )
        })}
      </div>

      {/* Links to per-client setups */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-purple-400" />
          Pour les connexions par client
        </h2>
        <p className="text-xs text-gray-400 mb-3">
          Ouvre la fiche d&apos;un client puis va dans <strong>Connexions</strong> pour brancher sa Page Facebook + compte Instagram Business.
        </p>
        <Link
          href="/clients"
          className="text-xs text-purple-300 hover:underline inline-flex items-center gap-1"
        >
          Voir tous les clients →
        </Link>
      </div>
    </div>
  )
}
