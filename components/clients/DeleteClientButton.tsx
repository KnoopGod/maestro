'use client'
import { useState, useTransition } from 'react'
import { Trash2, AlertTriangle } from 'lucide-react'
import { deleteClientAction } from '@/lib/actions/clients'

export function DeleteClientButton({
  clientId,
  clientName,
  compact = false,
}: {
  clientId: string
  clientName: string
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      await deleteClientAction(clientId)
    })
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Supprimer ${clientName}`}
        title={`Supprimer rapidement ${clientName}`}
        onClick={() => setOpen(true)}
        className={`${compact ? 'h-7 w-7 justify-center p-0' : 'px-3 py-2'} rounded-lg border border-gray-800 hover:border-red-700/50 hover:bg-red-950/30 text-gray-400 hover:text-red-400 text-sm flex items-center gap-1.5 transition-colors`}
      >
        <Trash2 className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md bg-gray-900 border border-red-700/30 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-950/50 border border-red-700/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Supprimer ce client ?</h3>
                <p className="text-sm text-gray-400 mt-1">
                  <strong className="text-gray-200">{clientName}</strong> sera supprimé définitivement avec tout son historique. Cette action est irréversible.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setOpen(false)}
                disabled={isPending}
                title="Annuler la suppression et conserver ce client"
                className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                title="Supprimer définitivement le client, ses posts et son historique local"
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium disabled:opacity-50"
              >
                {isPending ? 'Suppression...' : 'Oui, supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
