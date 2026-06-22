import Link from 'next/link'
import { Bot, CheckCircle2, Circle, CreditCard, ExternalLink, Plug } from 'lucide-react'
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

const CATEGORY_INFO = {
  ai:         { label: 'IA', color: 'bg-fuchsia-900/30 text-fuchsia-300 border-fuchsia-700/40' },
  social:     { label: 'Social API', color: 'bg-blue-900/30 text-blue-300 border-blue-700/40' },
  infra:      { label: 'Infrastructure', color: 'bg-emerald-900/30 text-emerald-300 border-emerald-700/40' },
  automation: { label: 'Automatisation', color: 'bg-amber-900/30 text-amber-300 border-amber-700/40' },
}

export default function ConnectionsPage() {
  const configured = CONNECTIONS.filter(c => c.isConfigured?.()).length
  const required = CONNECTIONS.filter(c => c.status === 'required')
  const requiredOk = required.filter(c => c.isConfigured?.()).length
  const aiConnections = CONNECTIONS.filter(c => c.category === 'ai')
  const paidConnections = CONNECTIONS.filter(c => /payante|crédit|coût|upgrade/i.test(c.credits))

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page header */}
      <div className="flex items-end justify-between border-b border-gray-800 pb-6">
        <div>
          <div className="text-[11px] text-indigo-500/60 font-mono tracking-[0.25em] uppercase mb-2">MAESTRO / CONNEXIONS</div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Plug className="w-7 h-7 text-purple-400" />
            Connexions
          </h1>
          <p className="text-sm text-gray-500 mt-1.5">
            Tunnel API pour activer MAESTRO · <span className="text-white font-medium">{configured}</span><span className="text-gray-600">/{CONNECTIONS.length}</span> configurées
          </p>
        </div>
        <div className="text-right bg-gray-900/40 border border-gray-800 rounded-xl px-4 py-3">
          <div className="text-xs text-gray-500 mb-0.5">MVP requis</div>
          <div className="text-xl font-bold">
            <span className={requiredOk === required.length ? 'text-emerald-400' : 'text-amber-400'}>
              {requiredOk}
            </span>
            <span className="text-gray-600">/{required.length}</span>
          </div>
        </div>
      </div>

      {/* AI/API cockpit */}
      <section className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-400" />
              Cockpit IA & API
            </h2>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Vue spéciale pour savoir quoi connecter, pourquoi, quel agent l&apos;utilise et si des crédits sont nécessaires.
            </p>
          </div>
          <div className="text-right text-xs flex-shrink-0">
            <div className="text-fuchsia-300 font-medium">{aiConnections.length} <span className="text-gray-500 font-normal">services IA</span></div>
            <div className="text-amber-300 font-medium mt-0.5">{paidConnections.length} <span className="text-gray-500 font-normal">avec coûts</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {CONNECTIONS.map(connection => {
            const category = CATEGORY_INFO[connection.category]
            const isOk = connection.isConfigured?.()
            return (
              <div
                key={connection.id}
                title={`${connection.name} — ${connection.purpose}`}
                className={`rounded-xl border p-4 transition-all ${isOk ? 'border-emerald-800/40 bg-emerald-950/10' : 'border-gray-800 bg-gray-950/40'}`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0 mt-0.5">{connection.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="text-sm font-semibold text-white">{connection.name}</h3>
                      <span className={`text-[10px] border rounded-full px-2 py-0.5 ${category.color}`}>
                        {category.label}
                      </span>
                      {isOk ? (
                        <span className="text-[10px] border rounded-full px-2 py-0.5 bg-emerald-900/30 text-emerald-300 border-emerald-700/40 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          connecté
                        </span>
                      ) : (
                        <span className="text-[10px] border rounded-full px-2 py-0.5 bg-gray-800 text-gray-400 border-gray-700">
                          à configurer
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed mb-3">{connection.purpose}</p>

                    <div className="grid grid-cols-1 gap-2 text-[11px]">
                      <InfoRow label="Spécialité" value={connection.specialty} />
                      <InfoRow label="Agents" value={connection.usedBy.join(' · ')} />
                      <div className="rounded-lg border border-amber-800/30 bg-amber-950/15 p-2">
                        <div className="text-[10px] uppercase tracking-wider text-amber-400 mb-1 flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          Crédit / coût
                        </div>
                        <p className="text-amber-100/80 text-xs">{connection.credits}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Explainer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-purple-950/30 border border-purple-700/30 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-2">Connexions globales</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Anthropic, OpenAI, URL publique : configurées une fois dans <code className="px-1.5 py-0.5 rounded bg-purple-950/50 text-purple-300 text-[11px]">.env.local</code>.
            Tous les clients réutilisent ces moteurs.
          </p>
        </div>
        <div className="bg-blue-950/30 border border-blue-700/30 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-2">Connexions par client</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Page Facebook, Instagram Business, library : refaites à chaque onboarding via{' '}
            <code className="px-1.5 py-0.5 rounded bg-blue-950/50 text-blue-300 text-[11px]">/clients/[id]/connections</code>.
          </p>
        </div>
      </div>

      {/* Meta section */}
      <section className="bg-blue-950/20 border border-blue-700/30 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Meta · à retenir</h2>
            <p className="text-xs text-gray-500 mt-1">
              La configuration Meta mélange une app globale et des tokens par client.
            </p>
          </div>
          <span className="text-[10px] border rounded-full px-2.5 py-1 bg-blue-900/30 text-blue-300 border-blue-700/40 flex-shrink-0">
            Facebook + Instagram
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <MetaNote
            label="Credentials globaux"
            value="META_APP_ID et META_APP_SECRET identifient l'app Meta MAESTRO. Ils se configurent une fois."
          />
          <MetaNote
            label="Tokens par client"
            value="Chaque Page Access Token se connecte depuis /clients/[id]/connections pour la Page Facebook du client."
          />
          <MetaNote
            label="Instagram"
            value="Le compte Instagram doit être professionnel et lié à cette Page Facebook."
          />
          <MetaNote
            label="Images"
            value="En production, Instagram exige des URLs publiques HTTPS. Les images localhost ne sont pas publiables."
          />
        </div>
      </section>

      {/* Quick-flow recap */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          Ordre recommandé de configuration
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
          {CONNECTIONS.map((c, i) => (
            <div
              key={c.id}
              title={`Étape ${i + 1} : ${c.name} — ${c.unlocks}`}
              className={`border rounded-lg p-2.5 transition-colors ${
                c.isConfigured?.()
                  ? 'bg-emerald-950/15 border-emerald-800/40'
                  : 'bg-gray-950/40 border-gray-800'
              }`}
            >
              <div className="text-[10px] text-purple-400 font-mono mb-1">#{i + 1}</div>
              <div className="text-sm font-medium text-white flex items-center gap-1.5 mb-2">
                <span>{c.emoji}</span>
                <span className="truncate text-xs">{c.name.split(' · ')[0]}</span>
              </div>
              <div>
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
              className={`rounded-2xl border p-5 transition-all ${
                isOk
                  ? 'bg-emerald-950/10 border-emerald-700/30 hover:border-emerald-700/50'
                  : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
              }`}
            >
              <header className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="text-3xl flex-shrink-0">{connection.emoji}</div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white text-sm">{connection.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-2">{connection.unlocks}</p>
                  </div>
                </div>
                {isOk ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                )}
              </header>

              <div className="flex gap-2 flex-wrap mb-4">
                <span className={`text-[10px] border rounded-full px-2 py-0.5 ${STATUS_INFO[connection.status].color}`}>
                  {STATUS_INFO[connection.status].label}
                </span>
                <span className={`text-[10px] border rounded-full px-2 py-0.5 ${SCOPE_INFO[connection.scope].color}`}>
                  {SCOPE_INFO[connection.scope].label}
                </span>
                <span className={`text-[10px] border rounded-full px-2 py-0.5 ${CATEGORY_INFO[connection.category].color}`}>
                  {CATEGORY_INFO[connection.category].label}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 mb-4">
                <InfoRow label="But" value={connection.purpose} />
                <InfoRow label="Spécialité" value={connection.specialty} />
                <InfoRow label="Utilisé par" value={connection.usedBy.join(' · ')} />
                <InfoRow label="Crédit / coût" value={connection.credits} highlight />
              </div>

              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Variables .env.local</div>
                <div className="flex gap-1.5 flex-wrap">
                  {connection.envVars.map(env => (
                    <code key={env} className="text-[11px] px-1.5 py-0.5 rounded bg-gray-950 border border-gray-800 text-gray-300 font-mono">
                      {env}
                    </code>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Guide</div>
                <ol className="space-y-1.5">
                  {connection.guide.map((step, i) => (
                    <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                      <span className="text-purple-400 font-semibold flex-shrink-0 min-w-[16px]">{i + 1}.</span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mb-4">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Test de validation</div>
                <p className="text-xs text-gray-400 italic leading-relaxed">{connection.test}</p>
              </div>

              {connection.providerUrl && (
                <a
                  href={connection.providerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Ouvrir le fournisseur pour configurer ${connection.name}`}
                  className="inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-purple-200 transition-colors group"
                >
                  Ouvrir le fournisseur
                  <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </a>
              )}
            </article>
          )
        })}
      </div>

      {/* Links to per-client setups */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-purple-400" />
          Connexions par client
        </h2>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
          Ouvre la fiche d&apos;un client puis va dans <strong className="text-gray-300">Connexions</strong> pour brancher sa Page Facebook + compte Instagram Business.
        </p>
        <Link
          href="/clients"
          title="Choisir un client pour connecter sa Page Facebook et son Instagram Business"
          className="inline-flex items-center gap-1.5 text-xs text-purple-300 hover:text-purple-200 transition-colors group"
        >
          Voir tous les clients
          <span className="group-hover:translate-x-0.5 transition-transform inline-block">→</span>
        </Link>
      </div>
    </div>
  )
}

function MetaNote({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-950/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-blue-300 mb-1.5">{label}</div>
      <p className="text-xs text-gray-300 leading-relaxed">{value}</p>
    </div>
  )
}

function InfoRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className={`rounded-lg border p-2.5 ${
      highlight
        ? 'border-amber-800/30 bg-amber-950/15'
        : 'border-gray-800 bg-gray-950/30'
    }`}>
      <div className={`text-[10px] uppercase tracking-wider mb-1 ${highlight ? 'text-amber-400' : 'text-gray-500'}`}>
        {label}
      </div>
      <p className={`text-xs leading-relaxed ${highlight ? 'text-amber-100/80' : 'text-gray-300'}`}>{value}</p>
    </div>
  )
}
