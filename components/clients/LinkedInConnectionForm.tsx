'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'

export function LinkedInConnectionForm({
  clientId,
  existing,
}: {
  clientId: string
  existing?: {
    handle: string | null
    accountId: string | null
    connectedAt: number | null
    expiresAt: number | null
  }
}) {
  const router = useRouter()
  const [organizationId, setOrganizationId] = useState(existing?.accountId ?? '')
  const [handle, setHandle] = useState(existing?.handle ?? '')
  const [accessToken, setAccessToken] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)
  const [isPending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      setError('')
      setOk(false)
      const res = await fetch(`/api/clients/${clientId}/social-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'linkedin',
          accountId: organizationId,
          handle,
          accessToken,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? 'Erreur connexion LinkedIn')
        return
      }
      setAccessToken('')
      setOk(true)
      router.refresh()
    })
  }

  return (
    <div className="rounded-2xl border border-sky-800/40 bg-sky-950/10 p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">LinkedIn Page entreprise</h3>
          <p className="mt-1 text-xs text-gray-500">
            Connexion manuelle via un token LinkedIn Developer avec le scope w_organization_social.
          </p>
        </div>
        {existing?.accountId && (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-700/40 bg-emerald-950/30 px-2 py-0.5 text-[10px] text-emerald-300">
            <CheckCircle2 className="h-3 w-3" />
            Connecté
          </span>
        )}
      </div>

      <div className="grid gap-3">
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-gray-300">ID de la Page LinkedIn</span>
          <input
            value={organizationId}
            onChange={event => setOrganizationId(event.target.value)}
            placeholder="Ex : 123456789"
            className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-600"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-gray-300">Nom affiché / handle</span>
          <input
            value={handle}
            onChange={event => setHandle(event.target.value)}
            placeholder="Ex : Pink House Samui"
            className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-600"
          />
        </label>

        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-gray-300">Access Token LinkedIn</span>
          <input
            value={accessToken}
            onChange={event => setAccessToken(event.target.value)}
            type="password"
            placeholder="Token Developer LinkedIn"
            className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-sky-600"
          />
        </label>
      </div>

      <p className="mt-3 text-[11px] text-gray-500">
        Les tokens LinkedIn expirent généralement après 60 jours. Ils sont chiffrés côté serveur avec MAESTRO_ENCRYPTION_KEY.
      </p>

      {error && <p className="mt-3 text-xs text-red-300">{error}</p>}
      {ok && <p className="mt-3 text-xs text-emerald-300">Connexion LinkedIn enregistrée.</p>}

      <button
        type="button"
        onClick={save}
        disabled={isPending || !organizationId.trim() || !accessToken.trim()}
        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Enregistrer LinkedIn
      </button>
    </div>
  )
}
