import { UserCircle } from 'lucide-react'
import { getSessionUser } from '@/lib/auth/session-v2'
import { ProfileForm } from '@/components/settings/ProfileForm'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const user = await getSessionUser()

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Profil</h1>
        <p className="text-gray-400 text-sm">
          Cette page est disponible uniquement en mode multi-utilisateurs (MULTI_USER_MODE=true).
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <UserCircle className="w-7 h-7 text-indigo-400" />
          Mon profil
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Modifier votre nom et votre mot de passe</p>
      </div>

      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
        <div className="mb-6 pb-4 border-b border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
          <p className="text-sm text-gray-300 font-mono">{user.email}</p>
          <p className="text-xs text-gray-600 mt-1">
            Rôle : <span className="text-indigo-400 capitalize">{user.role}</span>
          </p>
        </div>

        <ProfileForm initialName={user.name} />
      </div>
    </div>
  )
}
