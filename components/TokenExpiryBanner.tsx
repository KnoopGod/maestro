import Link from 'next/link'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import type { ExpiringToken } from '@/lib/db/queries/social-accounts'

const PLATFORM_LABEL: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
}

export function TokenExpiryBanner({ tokens }: { tokens: ExpiringToken[] }) {
  if (tokens.length === 0) return null

  const critical = tokens.filter(t => t.daysLeft <= 3)
  const isCritical = critical.length > 0

  return (
    <div className={`rounded-xl border p-4 ${
      isCritical
        ? 'bg-red-950/20 border-red-800/40'
        : 'bg-amber-950/20 border-amber-800/40'
    }`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isCritical ? 'text-red-400' : 'text-amber-400'}`} />
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold mb-2 ${isCritical ? 'text-red-300' : 'text-amber-300'}`}>
            {tokens.length === 1
              ? 'Un token social expire bientôt'
              : `${tokens.length} tokens sociaux expirent bientôt`
            }
          </div>
          <div className="space-y-1.5">
            {tokens.map(t => (
              <div key={`${t.clientId}-${t.platform}`} className="flex items-center gap-2 text-xs">
                <RefreshCw className={`w-3 h-3 flex-shrink-0 ${t.daysLeft <= 3 ? 'text-red-400' : 'text-amber-400'}`} />
                <span className="text-gray-300">
                  <span className="font-medium">{t.clientName}</span>
                  {' · '}
                  {PLATFORM_LABEL[t.platform] ?? t.platform}
                </span>
                <span className={`ml-auto font-mono text-[10px] ${t.daysLeft <= 3 ? 'text-red-400' : 'text-amber-400'}`}>
                  {t.daysLeft}j restant{t.daysLeft > 1 ? 's' : ''}
                </span>
                <Link
                  href={`/clients/${t.clientId}/connections`}
                  className="text-[10px] text-purple-400 hover:text-purple-300 flex-shrink-0"
                >
                  Renouveler →
                </Link>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-600 mt-3">
            Les tokens Meta (Facebook/Instagram) expirent après 60 jours. Reconnectez le compte avant expiration pour éviter l&apos;interruption des publications.
          </p>
        </div>
      </div>
    </div>
  )
}
