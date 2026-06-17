import Link from 'next/link'
import { ArrowLeft, Webhook, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { listRecentWebhookDeliveries, countWebhookDeliveries } from '@/lib/db/queries/webhook-log'
import type { WebhookDelivery } from '@/lib/db/queries/webhook-log'

export const dynamic = 'force-dynamic'

function formatRelative(ts: number): string {
  const diff = Date.now() - ts
  const min = Math.floor(diff / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h}h`
  const d = Math.floor(h / 24)
  return `il y a ${d}j`
}

const STATUS_CFG = {
  success: { icon: CheckCircle2, color: 'text-emerald-400', badge: 'bg-emerald-950/30 text-emerald-300 border-emerald-700/40', label: 'OK' },
  failed:  { icon: XCircle,      color: 'text-red-400',     badge: 'bg-red-950/30 text-red-300 border-red-700/40',             label: 'Erreur' },
  timeout: { icon: Clock,        color: 'text-amber-400',   badge: 'bg-amber-950/30 text-amber-300 border-amber-700/40',       label: 'Timeout' },
}

function DeliveryRow({ delivery }: { delivery: WebhookDelivery }) {
  const cfg = STATUS_CFG[delivery.status]
  const Icon = cfg.icon
  const post = delivery.payload as { post?: { clientName?: string } }
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800/60 last:border-0 hover:bg-gray-800/20 transition-colors">
      <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.color}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-300">{delivery.event}</span>
          {post?.post?.clientName && (
            <span className="text-[10px] text-gray-500">· {post.post.clientName}</span>
          )}
        </div>
        {delivery.error && (
          <div className="text-[10px] text-red-400 mt-0.5 truncate max-w-[300px]">{delivery.error}</div>
        )}
      </div>
      <span className={`text-[10px] border rounded-full px-2 py-0.5 flex-shrink-0 ${cfg.badge}`}>{cfg.label}</span>
      {delivery.httpStatus != null && (
        <span className="text-[10px] text-gray-500 flex-shrink-0 w-10 text-right">{delivery.httpStatus}</span>
      )}
      {delivery.durationMs != null && (
        <span className="text-[10px] text-gray-500 flex-shrink-0 w-14 text-right">{delivery.durationMs}ms</span>
      )}
      <span className="text-[10px] text-gray-600 flex-shrink-0 w-20 text-right">
        {formatRelative(delivery.createdAt)}
      </span>
    </div>
  )
}

export default async function WebhooksSettingsPage() {
  const [deliveries, counts] = await Promise.all([
    listRecentWebhookDeliveries(30),
    countWebhookDeliveries(),
  ])

  const isConfigured = Boolean(process.env.MAESTRO_WEBHOOK_URL)

  return (
    <div className="space-y-6 max-w-4xl">
      <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Paramètres
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Webhook className="w-6 h-6 text-cyan-400" />
          Webhooks
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Notifications envoyées vers {isConfigured ? 'votre endpoint configuré' : 'aucun endpoint (MAESTRO_WEBHOOK_URL non défini)'}
        </p>
      </div>

      {/* Config status */}
      <div className={`flex items-start gap-3 p-4 rounded-xl border ${
        isConfigured
          ? 'bg-emerald-950/20 border-emerald-800/30'
          : 'bg-amber-950/20 border-amber-800/30'
      }`}>
        {isConfigured ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        )}
        <div>
          <div className={`text-sm font-medium ${isConfigured ? 'text-emerald-200' : 'text-amber-200'}`}>
            {isConfigured ? 'Webhook configuré' : 'Webhook non configuré'}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {isConfigured
              ? 'Les événements post.published, post.failed et post.scheduled sont envoyés automatiquement.'
              : "Définissez MAESTRO_WEBHOOK_URL dans votre .env.local pour activer les notifications."}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{counts.total}</div>
          <div className="text-xs text-gray-500 mt-1">Total envois</div>
        </div>
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{counts.total - counts.failures}</div>
          <div className="text-xs text-gray-500 mt-1">Réussis</div>
        </div>
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 text-center">
          <div className={`text-2xl font-bold ${counts.failures > 0 ? 'text-red-400' : 'text-gray-500'}`}>{counts.failures}</div>
          <div className="text-xs text-gray-500 mt-1">Échecs</div>
        </div>
      </div>

      {/* Delivery log */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">30 derniers envois</h2>
          {deliveries.length > 0 && (
            <span className="text-[10px] text-gray-500">{deliveries.length} entrée{deliveries.length > 1 ? 's' : ''}</span>
          )}
        </div>

        {deliveries.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-8">
            {isConfigured
              ? 'Aucun webhook envoyé pour le moment.'
              : 'Configure MAESTRO_WEBHOOK_URL pour voir les livraisons ici.'}
          </p>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-900/60 border-b border-gray-800">
              <div className="w-4 flex-shrink-0" />
              <div className="flex-1 text-[10px] uppercase tracking-wider text-gray-500">Événement</div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 flex-shrink-0">Statut</div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 flex-shrink-0 w-10 text-right">HTTP</div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 flex-shrink-0 w-14 text-right">Durée</div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 flex-shrink-0 w-20 text-right">Quand</div>
            </div>
            {deliveries.map(d => <DeliveryRow key={d.id} delivery={d} />)}
          </>
        )}
      </div>

      {/* Events reference */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3">Événements disponibles</h2>
        <div className="space-y-2">
          {[
            { event: 'post.published', desc: 'Post publié avec succès sur Meta', color: 'text-emerald-400' },
            { event: 'post.failed',    desc: 'Publication ou génération échouée', color: 'text-red-400' },
            { event: 'post.scheduled', desc: 'Post planifié pour une date future', color: 'text-blue-400' },
          ].map(e => (
            <div key={e.event} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-950/40 border border-gray-800">
              <code className={`text-xs font-mono ${e.color}`}>{e.event}</code>
              <span className="text-xs text-gray-400">{e.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
