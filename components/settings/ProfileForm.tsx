'use client'
import { useState, useTransition } from 'react'
import { Check, Loader2 } from 'lucide-react'

interface Props {
  initialName: string
}

export function ProfileForm({ initialName }: Props) {
  const [name, setName] = useState(initialName)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSuccessMsg(null)
    setError(null)

    if (newPassword && newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    const payload: Record<string, string> = {}
    if (name.trim() !== initialName) payload.name = name.trim()
    if (newPassword) {
      payload.currentPassword = currentPassword
      payload.newPassword = newPassword
    }

    if (Object.keys(payload).length === 0) {
      setError('Aucune modification détectée')
      return
    }

    startTransition(async () => {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Erreur')
        return
      }
      setSuccessMsg('Profil mis à jour')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      <div className="space-y-1.5">
        <label className="block text-xs text-gray-400 uppercase tracking-wider">Nom affiché</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          maxLength={100}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="border-t border-gray-800 pt-6">
        <p className="text-xs text-gray-500 mb-4 uppercase tracking-wider">Changer le mot de passe</p>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="block text-xs text-gray-400">Mot de passe actuel</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs text-gray-400">Nouveau mot de passe</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[10px] text-gray-600">Minimum 8 caractères</p>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs text-gray-400">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/30 border border-red-800/40 rounded-lg px-3 py-2">{error}</p>
      )}
      {successMsg && (
        <p className="text-sm text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 rounded-lg px-3 py-2 flex items-center gap-2">
          <Check className="w-4 h-4" /> {successMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        Enregistrer
      </button>
    </form>
  )
}
