import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
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

        <MetaPreflightChecklist onReady={() => {}} />

        <MetaConnectionWizard
          clientId={id}
          clientName={client.name}
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
