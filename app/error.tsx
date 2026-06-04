'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Maestro] Page error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-gray-900/60 border border-red-800/40 p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        <div className="text-[9px] text-red-500/60 font-mono tracking-[0.3em] uppercase mb-2">
          // ERREUR SYSTÈME
        </div>
        <h2 className="text-base font-bold text-[#E0E3FF] font-mono uppercase mb-3">
          Une erreur est survenue
        </h2>
        <p className="text-[11px] text-gray-500 font-mono mb-6 leading-relaxed">
          {error.message || 'Erreur inconnue. Vérifiez la configuration de l\'environnement.'}
        </p>
        {error.digest && (
          <p className="text-[9px] text-gray-700 font-mono mb-4">
            ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600/20 border border-indigo-600/40 text-indigo-400 text-[11px] font-mono hover:bg-indigo-600/30 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          RÉESSAYER
        </button>
      </div>
    </div>
  )
}
