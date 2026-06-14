'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Loader2 } from 'lucide-react'

export function CreateUserForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'owner' | 'editor'>('editor')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    })
    const d = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError((d as { error?: string }).error ?? 'Erreur création')
      setSaving(false)
      return
    }
    setName(''); setEmail(''); setPassword(''); setRole('editor')
    setOpen(false)
    setSaving(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
      >
        <UserPlus className="w-4 h-4" />
        Inviter un collaborateur
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="bg-gray-900/60 border border-gray-700 rounded-2xl p-5 space-y-3">
      <h3 className="text-sm font-semibold text-white">Nouveau collaborateur</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Nom</label>
          <input
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Marie Dupont"
            className="w-full bg-gray-950 border border-gray-700 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Email</label>
          <input
            required
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="marie@agence.com"
            className="w-full bg-gray-950 border border-gray-700 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Mot de passe temporaire</label>
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="8 caractères minimum"
            className="w-full bg-gray-950 border border-gray-700 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Rôle</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value as 'owner' | 'editor')}
            className="w-full bg-gray-950 border border-gray-700 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
          >
            <option value="editor">Éditeur</option>
            <option value="owner">Propriétaire</option>
          </select>
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          Créer le compte
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null) }}
          className="px-3 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 text-sm transition-colors"
        >
          Annuler
        </button>
      </div>

      <p className="text-[10px] text-gray-600">
        Note : la connexion V2 multi-utilisateurs est en cours de développement.
        Les comptes créés ici seront activés dans une prochaine mise à jour.
      </p>
    </form>
  )
}
