'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, Wrench } from 'lucide-react'

export function RunMigrationsButton() {
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function runMigrations() {
    setState('running')
    setMessage(null)
    try {
      const res = await fetch('/api/admin/migrate', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Migration impossible')
      setState('done')
      setMessage(data.db?.isLocal ? 'Schéma local vérifié.' : 'Schéma production vérifié.')
    } catch (err) {
      setState('error')
      setMessage(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  return (
    <div className="rounded-2xl border border-indigo-900/40 bg-gray-950/60 p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-800/40 bg-indigo-950/40">
          <Wrench className="h-5 w-5 text-indigo-300" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white">Migrations base de données</h2>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">
            À lancer après une mise à jour qui ajoute des champs ou tables. Cette action est idempotente : elle vérifie puis applique seulement ce qui manque.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={runMigrations}
        disabled={state === 'running'}
        className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-950 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === 'running' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        {state === 'running' ? 'Application...' : 'Appliquer les migrations'}
      </button>

      {message ? (
        <p className={`mt-3 text-xs ${state === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>
          {message}
        </p>
      ) : null}
    </div>
  )
}
