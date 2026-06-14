import { ArrowLeft, Users, ShieldCheck, Edit3, Clock } from 'lucide-react'
import Link from 'next/link'
import { listUsers } from '@/lib/db/queries/users'
import { CreateUserForm } from '@/components/settings/CreateUserForm'
import { UserToggle } from '@/components/settings/UserToggle'

export const dynamic = 'force-dynamic'

const ROLE_LABEL: Record<string, { label: string; cls: string }> = {
  owner: { label: 'Propriétaire', cls: 'text-purple-300 border-purple-700/40 bg-purple-950/20' },
  editor: { label: 'Éditeur',     cls: 'text-blue-300   border-blue-700/40   bg-blue-950/20'   },
}

export default async function TeamPage() {
  const users = await listUsers()

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/settings" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300">
        <ArrowLeft className="w-4 h-4" />
        Paramètres
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            Équipe
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérer les collaborateurs et leurs accès</p>
        </div>
        <CreateUserForm />
      </div>

      <div className="bg-amber-950/20 border border-amber-700/30 rounded-xl p-4 text-sm text-amber-200">
        <strong className="text-white">Fonctionnalité en préparation.</strong> Les comptes créés ici sont stockés
        en base. La connexion multi-utilisateurs sera activée dans une prochaine mise à jour.
        Pour l&apos;instant, l&apos;accès admin reste géré par <code className="text-amber-300">CODEXRS_PASSWORD</code>.
      </div>

      {users.length === 0 ? (
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-8 text-center text-gray-500 text-sm">
          Aucun collaborateur enregistré. Invitez le premier membre de votre équipe.
        </div>
      ) : (
        <div className="space-y-2">
          {users.map(user => {
            const roleCfg = ROLE_LABEL[user.role] ?? { label: user.role, cls: 'text-gray-400 border-gray-700 bg-gray-800/20' }
            return (
              <div key={user.id} className="flex items-center gap-4 bg-gray-900/40 border border-gray-800 rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center text-sm font-semibold text-gray-300 flex-shrink-0">
                  {user.name[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">{user.name}</span>
                    <span className={`text-[10px] border rounded-full px-2 py-0.5 ${roleCfg.cls}`}>{roleCfg.label}</span>
                    {!user.active && (
                      <span className="text-[10px] border rounded-full px-2 py-0.5 text-red-300 border-red-700/40 bg-red-950/20">Désactivé</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  {user.lastLoginAt ? (
                    <div className="hidden sm:flex items-center gap-1 text-[10px] text-gray-600">
                      <Clock className="w-3 h-3" />
                      {new Date(user.lastLoginAt).toLocaleDateString('fr-FR')}
                    </div>
                  ) : (
                    <span className="hidden sm:block text-[10px] text-gray-700">Jamais connecté</span>
                  )}
                  <UserToggle user={user} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 space-y-2 text-xs text-gray-500">
        <div className="flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
          <div><strong className="text-gray-300">Propriétaire</strong> — accès complet : créer clients, gérer l&apos;équipe, voir les finances et les coûts IA.</div>
        </div>
        <div className="flex items-start gap-2">
          <Edit3 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div><strong className="text-gray-300">Éditeur</strong> — génération de contenu, validation, publication. Pas d&apos;accès aux paramètres de facturation.</div>
        </div>
      </div>
    </div>
  )
}
