import Link from 'next/link'
import { AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react'

interface SetupItem {
  key: string
  label: string
  ok: boolean
  hint: string
  action?: { href: string; text: string; external?: boolean }
}

function getSetupItems(): SetupItem[] {
  const isVercel = !!process.env.VERCEL
  const isLocalDb = !process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith('file:')

  return [
    {
      key: 'anthropic',
      label: 'ANTHROPIC_API_KEY',
      ok: !!process.env.ANTHROPIC_API_KEY,
      hint: 'Requis pour tous les agents IA — captions, supervision, analyse.',
      action: { href: 'https://console.anthropic.com/settings/keys', text: 'Créer une clé', external: true },
    },
    {
      key: 'openai',
      label: 'OPENAI_API_KEY',
      ok: !!process.env.OPENAI_API_KEY,
      hint: 'Requis pour la génération d\'images (gpt-image-1).',
      action: { href: 'https://platform.openai.com/api-keys', text: 'Créer une clé', external: true },
    },
    {
      key: 'blob',
      label: 'BLOB_READ_WRITE_TOKEN',
      ok: !!process.env.BLOB_READ_WRITE_TOKEN,
      hint: isVercel
        ? 'Requis en production — Vercel Blob pour le stockage des images. Dashboard Vercel → Storage → Blob → Connect.'
        : 'Optionnel en local — requis sur Vercel pour que les images générées soient accessibles par Meta.',
      action: isVercel
        ? { href: 'https://vercel.com/dashboard', text: 'Dashboard Vercel', external: true }
        : undefined,
    },
    {
      key: 'turso',
      label: 'DATABASE_URL (Turso)',
      ok: !isLocalDb,
      hint: isVercel
        ? 'En production, la DB locale ne persiste pas. Créer une DB Turso et définir DATABASE_URL + DATABASE_AUTH_TOKEN.'
        : 'Optionnel en local — vous utilisez SQLite local (maestro.db). Configurer Turso avant de déployer en prod.',
      action: { href: 'https://turso.tech', text: 'Créer une DB Turso', external: true },
    },
    {
      key: 'meta',
      label: 'Token Meta connecté',
      ok: false, // always shown as actionable — can't check from server without DB per client
      hint: 'Connecter un token Facebook/Instagram sur au moins un client pour publier.',
      action: { href: '/clients', text: 'Gérer les clients' },
    },
  ]
}

export function SetupBanner() {
  const items = getSetupItems()
  const missing = items.filter(i => !i.ok)

  if (missing.length === 0) return null

  const critical = missing.filter(i => ['anthropic', 'openai'].includes(i.key))
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
          <div className={`text-sm font-semibold mb-3 ${isCritical ? 'text-red-300' : 'text-amber-300'}`}>
            {isCritical
              ? `${missing.length} configuration${missing.length > 1 ? 's' : ''} critique${missing.length > 1 ? 's' : ''} manquante${missing.length > 1 ? 's' : ''}`
              : `${missing.length} étape${missing.length > 1 ? 's' : ''} restante${missing.length > 1 ? 's' : ''} avant production`
            }
          </div>

          <div className="space-y-2">
            {items.map(item => (
              <div key={item.key} className="flex items-start gap-2.5">
                {item.ok ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <div className={`w-4 h-4 mt-0.5 flex-shrink-0 rounded-full border-2 ${
                    ['anthropic', 'openai'].includes(item.key) ? 'border-red-500' : 'border-amber-600'
                  }`} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className={`text-xs font-mono ${item.ok ? 'text-emerald-400' : 'text-gray-300'}`}>
                      {item.label}
                    </code>
                    {!item.ok && item.action && (
                      item.action.external ? (
                        <a
                          href={item.action.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300"
                        >
                          {item.action.text}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ) : (
                        <Link href={item.action.href} className="text-[10px] text-purple-400 hover:text-purple-300">
                          {item.action.text} →
                        </Link>
                      )
                    )}
                  </div>
                  {!item.ok && (
                    <p className="text-[11px] text-gray-500 mt-0.5">{item.hint}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!isCritical && (
            <p className="text-[11px] text-gray-500 mt-3">
              L&apos;application fonctionne en développement local. Ces étapes sont requises avant déploiement en production.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
