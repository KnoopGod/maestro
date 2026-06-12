'use client'
import { useEffect, useState, useTransition } from 'react'
import { Link2, Copy, Check, RefreshCw, ShieldCheck } from 'lucide-react'

export function PortalLinkCard({ clientId }: { clientId: string }) {
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [confirmRotate, setConfirmRotate] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    fetch(`/api/clients/${clientId}/portal`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => d?.token && setToken(d.token))
      .catch(() => undefined)
  }, [clientId])

  const url = token && typeof window !== 'undefined' ? `${window.location.origin}/portal/${token}` : ''

  const copy = async () => {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const rotate = () => {
    startTransition(async () => {
      const r = await fetch(`/api/clients/${clientId}/portal`, { method: 'POST' })
      if (r.ok) {
        const d = await r.json()
        setToken(d.token)
      }
      setConfirmRotate(false)
    })
  }

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
        <h3 className="text-sm font-medium text-gray-200">Lien client sécurisé</h3>
      </div>
      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
        Bilan en lecture seule, accessible sans mot de passe via un lien privé non devinable. Aucune donnée interne (coûts, marge) n&apos;y figure.
      </p>

      <div className="flex items-center gap-2">
        <input
          readOnly
          value={url || 'Génération du lien...'}
          onFocus={e => e.currentTarget.select()}
          className="flex-1 min-w-0 bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono outline-none focus:border-indigo-600"
        />
        <button
          type="button"
          onClick={copy}
          disabled={!url}
          title="Copier le lien"
          className="p-2 rounded-lg border border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-white transition-colors disabled:opacity-40"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="inline-flex items-center gap-1.5 text-[10px] text-gray-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Révoquez à tout moment en régénérant le lien
        </span>
        {confirmRotate ? (
          <span className="flex items-center gap-2">
            <button
              type="button"
              onClick={rotate}
              disabled={isPending}
              className="text-[11px] text-red-400 hover:underline disabled:opacity-50"
            >
              {isPending ? 'Régénération...' : 'Confirmer'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmRotate(false)}
              disabled={isPending}
              className="text-[11px] text-gray-500 hover:text-gray-300"
            >
              Annuler
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmRotate(true)}
            disabled={!token}
            title="Invalider l'ancien lien et en générer un nouveau"
            className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-white disabled:opacity-40"
          >
            <RefreshCw className="w-3 h-3" />
            Régénérer
          </button>
        )}
      </div>
    </div>
  )
}
