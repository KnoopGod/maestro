import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { getClient } from '@/lib/db/queries/clients'
import { listClientSocialAccounts } from '@/lib/db/queries/social-accounts'
import { MetaConnectionWizard } from '@/components/clients/MetaConnectionWizard'
import { MetaPreflightChecklist } from '@/components/clients/MetaPreflightChecklist'

export const dynamic = 'force-dynamic'

export default async function ClientConnectionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await getClient(id)
  if (!client) notFound()

  const accounts = await listClientSocialAccounts(id)
  const metaConfig = {
    appIdConfigured: Boolean(process.env.META_APP_ID),
    appSecretConfigured: Boolean(process.env.META_APP_SECRET),
    longLivedReady: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
    publicMediaReady: Boolean(
      process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.CODEXRS_PUBLIC_URL && !/localhost|127\.0\.0\.1/.test(process.env.CODEXRS_PUBLIC_URL))
    ),
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href={`/clients/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300">
        <ArrowLeft className="w-4 h-4" />
        Retour à {client.name}
      </Link>

      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${client.color} flex items-center justify-center text-2xl shadow-lg`}>
          {client.emoji}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{client.name}</h1>
          <p className="text-sm text-gray-400">Connexions aux réseaux sociaux</p>
        </div>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <span className="text-lg">🔌</span>
          Meta (Facebook + Instagram)
        </h2>

        <GlobalMetaConfigStatus config={metaConfig} />

        <MetaPreflightChecklist />

        <MetaConnectionWizard
          clientId={id}
          clientName={client.name}
          metaConfig={metaConfig}
          existingAccounts={accounts.filter(a => a.platform === 'facebook' || a.platform === 'instagram').map(a => ({
            platform: a.platform as 'facebook' | 'instagram',
            handle: a.handle,
            accountId: a.accountId,
            connectedAt: a.connectedAt,
          }))}
        />
      </section>

      {/* Future platforms placeholder */}
      <section className="opacity-50">
        <h2 className="text-sm font-semibold text-white mb-3">🎵 TikTok · 💼 LinkedIn · 📍 Google Business</h2>
        <div className="bg-gray-900/20 border border-dashed border-gray-700 rounded-2xl p-6 text-center text-sm text-gray-500">
          Intégrations à venir
        </div>
      </section>
    </div>
  )
}

function GlobalMetaConfigStatus({
  config,
}: {
  config: {
    appIdConfigured: boolean
    appSecretConfigured: boolean
    longLivedReady: boolean
    publicMediaReady: boolean
  }
}) {
  return (
    <div className="mb-4 rounded-2xl border border-gray-800 bg-gray-900/40 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Configuration globale Meta</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            À faire une seule fois pour CODEXRS, puis réutilisé pour tous les clients.
          </p>
        </div>
        <span className={`text-[10px] border rounded-full px-2 py-0.5 ${
          config.longLivedReady
            ? 'border-emerald-700/40 bg-emerald-950/30 text-emerald-300'
            : 'border-amber-700/40 bg-amber-950/30 text-amber-300'
        }`}>
          {config.longLivedReady ? 'tokens longue durée prêts' : 'tokens temporaires possibles'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <ConfigChip label="META_APP_ID" ok={config.appIdConfigured} />
        <ConfigChip label="META_APP_SECRET" ok={config.appSecretConfigured} />
        <ConfigChip label="Images publiques" ok={config.publicMediaReady} />
      </div>

      {(!config.longLivedReady || !config.publicMediaReady) && (
        <div className="mt-3 rounded-lg border border-amber-800/30 bg-amber-950/20 px-3 py-2">
          <p className="text-xs text-amber-200">
            {config.longLivedReady
              ? 'Les clés Meta sont prêtes. Il reste surtout à garantir des URLs publiques pour Instagram si tu publies des images.'
              : 'Ajoute META_APP_ID et META_APP_SECRET dans Vercel puis redéploie pour convertir automatiquement les tokens en longue durée.'}
          </p>
        </div>
      )}
    </div>
  )
}

function ConfigChip({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950/40 px-3 py-2">
      {ok ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      ) : (
        <AlertCircle className="w-4 h-4 text-amber-400" />
      )}
      <span className={`text-xs font-mono ${ok ? 'text-emerald-300' : 'text-amber-300'}`}>{label}</span>
    </div>
  )
}
