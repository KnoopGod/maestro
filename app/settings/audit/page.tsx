import { Shield } from 'lucide-react'
import { listAuditLog, countAuditLog } from '@/lib/db/queries/audit-log'

export const dynamic = 'force-dynamic'

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  'auth.login':            { label: 'Connexion',               color: 'text-emerald-400' },
  'auth.login.failed':     { label: 'Tentative échouée',       color: 'text-red-400'     },
  'auth.logout':           { label: 'Déconnexion',             color: 'text-gray-400'    },
  'auth.password_changed': { label: 'Mot de passe modifié',    color: 'text-amber-400'   },
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1'))
  const limit = 50
  const offset = (page - 1) * limit

  const [entries, total] = await Promise.all([
    listAuditLog({ limit, offset }),
    countAuditLog(),
  ])

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Shield className="w-7 h-7 text-red-400" />
          Journal d&apos;audit
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Historique des connexions et actions sensibles · {total} entrées
        </p>
      </div>

      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
        {entries.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">Aucune entrée dans le journal.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="px-4 py-3 text-[10px] text-gray-500 uppercase tracking-wider font-medium">Date</th>
                  <th className="px-4 py-3 text-[10px] text-gray-500 uppercase tracking-wider font-medium">Action</th>
                  <th className="px-4 py-3 text-[10px] text-gray-500 uppercase tracking-wider font-medium hidden sm:table-cell">Utilisateur</th>
                  <th className="px-4 py-3 text-[10px] text-gray-500 uppercase tracking-wider font-medium hidden md:table-cell">IP</th>
                  <th className="px-4 py-3 text-[10px] text-gray-500 uppercase tracking-wider font-medium hidden lg:table-cell">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {entries.map(entry => {
                  const cfg = ACTION_LABELS[entry.action]
                  return (
                    <tr key={entry.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 text-[11px] text-gray-400 whitespace-nowrap font-mono">
                        {new Date(entry.createdAt).toLocaleString('fr-FR', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        {cfg ? (
                          <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                        ) : (
                          <span className="text-xs text-gray-400 font-mono">{entry.action}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-gray-500 hidden sm:table-cell font-mono">
                        {entry.userId ? entry.userId.slice(0, 8) + '…' : '—'}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-gray-600 hidden md:table-cell font-mono">
                        {entry.ip ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-gray-600 hidden lg:table-cell font-mono max-w-[200px] truncate">
                        {entry.metadata ? JSON.stringify(entry.metadata) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
            <span className="text-xs text-gray-500">Page {page} / {totalPages}</span>
            <div className="flex gap-2">
              {page > 1 && (
                <a href={`?page=${page - 1}`} className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors">
                  ← Précédent
                </a>
              )}
              {page < totalPages && (
                <a href={`?page=${page + 1}`} className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-colors">
                  Suivant →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
