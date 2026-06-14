'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Unlink } from 'lucide-react'

interface Props {
  clientId: string
  existing?: { accountId: string | null; connectedAt: number | null; expiresAt: number | null }
}

export function LinkedInConnectionForm({ clientId, existing }: Props) {
  const router = useRouter()
  const [pageId, setPageId] = useState('')
  const [token, setToken] = useState('')
  const [saving, setSaving] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleDisconnect = async () => {
    if (!confirm('Déconnecter LinkedIn pour ce client ?')) return
    setDisconnecting(true)
    setError(null)
    const res = await fetch(`/api/clients/${clientId}/social-accounts`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: 'linkedin' }),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError((d as { error?: string }).error ?? 'Erreur déconnexion')
    } else {
      router.refresh()
    }
    setDisconnecting(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pageId.trim() || !token.trim()) return
    setSaving(true)
    setError(null)
    setSuccess(false)

    const res = await fetch(`/api/clients/${clientId}/social-accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: 'linkedin',
        handle: pageId.trim(),
        accountId: pageId.trim(),
        accessToken: token.trim(),
        // LinkedIn tokens expire in 60 days
        expiresAt: Date.now() + 60 * 24 * 60 * 60 * 1000,
      }),
    })

    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError((d as { error?: string }).error ?? 'Erreur lors de la sauvegarde.')
    } else {
      setSuccess(true)
      setPageId('')
      setToken('')
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/40 p-5 space-y-4">
      {existing?.accountId && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-800/40 bg-emerald-950/20 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 text-sm">✓</span>
            <div className="text-xs text-emerald-300">
              Page connectée : <span className="font-mono">{existing.accountId}</span>
              {existing.expiresAt && (
                <span className="ml-2 text-emerald-400/70">
                  · Expire le {new Date(existing.expiresAt).toLocaleDateString('fr-FR')}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={disconnecting}
            title="Déconnecter LinkedIn"
            className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors"
          >
            <Unlink className="w-3 h-3" />
            Déconnecter
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">ID de la Page LinkedIn</label>
          <input
            type="text"
            value={pageId}
            onChange={e => setPageId(e.target.value)}
            placeholder="123456789"
            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
          />
          <p className="text-[10px] text-gray-500 mt-1">
            Le numéro d&apos;identifiant de votre Page LinkedIn (visible dans l&apos;URL linkedin.com/company/XXXXX ou dans Admin &gt; Paramètres).
          </p>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Access Token LinkedIn</label>
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="AQV…"
            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
          />
          <p className="text-[10px] text-gray-500 mt-1">
            Token Bearer OAuth 2.0 avec le scope <code className="text-gray-400">w_organization_social</code>.
            Les tokens LinkedIn expirent en 60 jours — renouvelable depuis LinkedIn Developer Portal.
            Le token est chiffré avant stockage.
          </p>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}
        {success && <p className="text-xs text-emerald-400">Connexion LinkedIn enregistrée.</p>}

        <button
          type="submit"
          disabled={saving || !pageId.trim() || !token.trim()}
          className="w-full py-2 text-sm font-medium rounded-lg bg-blue-700 text-white hover:bg-blue-600 disabled:opacity-40 transition-colors"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer la connexion LinkedIn'}
        </button>
      </form>
    </div>
  )
}
