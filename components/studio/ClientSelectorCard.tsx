'use client'
import type { Client } from '@/types/client'
import type { Post } from '@/types/post'

interface ClientDaStatus { active: boolean; summary?: string }

interface Props {
  clients: Client[]
  clientId: string
  selectedClient: Client | undefined
  selectedDa: ClientDaStatus | undefined
  initialPost?: Post
  onClientChange: (id: string) => void
}

export function ClientSelectorCard({ clients, clientId, selectedClient, selectedDa, initialPost, onClientChange }: Props) {
  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
      <label className="text-sm font-semibold text-white mb-3 block">👤 Client</label>
      <select
        value={clientId}
        onChange={e => onClientChange(e.target.value)}
        title="Choisir le client dont la stratégie, la DA et les connexions seront utilisées pour générer le post"
        className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
      >
        {clients.map(c => (
          <option key={c.id} value={c.id}>
            {c.emoji} {c.name} · {c.city || '—'}
          </option>
        ))}
      </select>

      {selectedClient && (
        <div className="mt-3 space-y-2">
          <div className="p-3 rounded-lg bg-purple-950/30 border border-purple-700/30 text-xs">
            <div className="text-purple-300 font-medium mb-1">Voix de marque chargée :</div>
            <div className="text-gray-300">{selectedClient.brandVoiceTone || 'Non définie'}</div>
          </div>
          <div className={`p-3 rounded-lg border text-xs ${
            selectedDa?.active
              ? 'bg-emerald-950/30 border-emerald-700/30'
              : 'bg-amber-950/30 border-amber-700/30'
          }`}>
            <div className={selectedDa?.active ? 'text-emerald-300 font-medium mb-1' : 'text-amber-300 font-medium mb-1'}>
              {selectedDa?.active ? 'DA active' : 'Aucune DA'}
            </div>
            <div className={selectedDa?.active ? 'text-emerald-100/80' : 'text-amber-100/80'}>
              {selectedDa?.active
                ? selectedDa.summary || 'Identité visuelle analysée et disponible pour les agents.'
                : 'Ajoute ou analyse les médias du client pour guider les visuels IA.'}
            </div>
            {!selectedDa?.active && (
              <a href={`/clients/${selectedClient.id}/library`} className="mt-2 inline-block text-amber-200 hover:underline">
                Ouvrir la Library →
              </a>
            )}
          </div>
        </div>
      )}

      {initialPost && (
        <div className="mt-3 p-3 rounded-lg bg-blue-950/30 border border-blue-700/30 text-xs">
          <div className="text-blue-300 font-medium mb-1">Draft chargé depuis la validation</div>
          <div className="text-gray-300">Post #{initialPost.id} · {initialPost.status}</div>
        </div>
      )}
    </div>
  )
}
