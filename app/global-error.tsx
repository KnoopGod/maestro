'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Maestro] Global error:', error)
  }, [error])

  return (
    <html lang="fr">
      <body className="min-h-screen bg-[#07081A] text-[#E0E3FF] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-[9px] text-red-500/60 font-mono tracking-[0.3em] uppercase mb-4">
            // ERREUR CRITIQUE
          </div>
          <h1 className="text-xl font-bold mb-4 font-mono">MAESTRO — ERREUR</h1>
          <p className="text-sm text-gray-400 mb-6 font-mono leading-relaxed">
            {error.message || 'Une erreur critique est survenue. Vérifiez les variables d\'environnement (DATABASE_URL, ANTHROPIC_API_KEY).'}
          </p>
          {error.digest && (
            <p className="text-[10px] text-gray-600 font-mono mb-4">ID: {error.digest}</p>
          )}
          <button
            onClick={reset}
            className="px-4 py-2 border border-indigo-600/40 text-indigo-400 text-xs font-mono hover:bg-indigo-600/20 transition-colors"
          >
            RÉESSAYER
          </button>
        </div>
      </body>
    </html>
  )
}
