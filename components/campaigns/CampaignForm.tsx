'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles } from 'lucide-react'
import type { Client, BusinessObjective } from '@/types/client'
import { BUSINESS_OBJECTIVES } from '@/types/client'
import type { CampaignChannel } from '@/types/campaign'
import { CAMPAIGN_CHANNELS } from '@/types/campaign'

export function CampaignForm({ clients, initialClientId }: { clients: Client[]; initialClientId?: string }) {
  const router = useRouter()
  const [clientId, setClientId] = useState(initialClientId || clients[0]?.id || '')
  const [name, setName] = useState('')
  const [channel, setChannel] = useState<CampaignChannel>('meta_ads')
  const [objective, setObjective] = useState<BusinessObjective>('attract_new_customers')
  const [budget, setBudget] = useState('300')
  const [startAt, setStartAt] = useState('')
  const [endAt, setEndAt] = useState('')
  const [brief, setBrief] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const selectedClient = clients.find(c => c.id === clientId)
  const budgetNum = parseFloat(budget.replace(',', '.'))
  const canSubmit = clientId && name.trim() && Number.isFinite(budgetNum) && budgetNum > 0 && !submitting

  // Pré-sélectionner l'objectif prioritaire du client quand il change
  function handleClientChange(id: string) {
    setClientId(id)
    const client = clients.find(c => c.id === id)
    if (client?.businessProfile?.priorityObjective) {
      setObjective(client.businessProfile.priorityObjective)
    }
  }

  async function submit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          clientId,
          name: name.trim(),
          channel,
          objective,
          budgetEur: budgetNum,
          startAt: startAt ? new Date(startAt).getTime() : null,
          endAt: endAt ? new Date(endAt).getTime() : null,
          brief: brief.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur création campagne')
      router.push(`/campaigns/${data.campaign.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur création campagne')
      setSubmitting(false)
    }
  }

  const inputClass = 'w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-[#E0E3FF] placeholder:text-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all duration-150'

  return (
    <div className="space-y-5">
      {/* Client */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-300 block mb-1.5">Client <span className="text-red-400">*</span></label>
          <select value={clientId} onChange={e => handleClientChange(e.target.value)} className={inputClass}>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.emoji} {c.name}{c.city ? ` · ${c.city}` : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 block mb-1.5">Nom de la campagne <span className="text-red-400">*</span></label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Leads devis — rentrée septembre"
            className={inputClass}
          />
        </div>
      </div>

      {/* Canal */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
        <label className="text-sm font-medium text-gray-300 block mb-2">Canal publicitaire <span className="text-red-400">*</span></label>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(CAMPAIGN_CHANNELS) as CampaignChannel[]).map(c => {
            const cfg = CAMPAIGN_CHANNELS[c]
            const active = channel === c
            return (
              <button
                key={c}
                type="button"
                onClick={() => setChannel(c)}
                className={`rounded-xl border p-4 text-left transition-all duration-150 active:scale-[0.98] ${
                  active
                    ? 'border-purple-500 bg-purple-900/20 ring-1 ring-purple-500/30'
                    : 'border-gray-800 bg-gray-950/60 hover:border-gray-700'
                }`}
              >
                <div className="text-2xl mb-1">{cfg.emoji}</div>
                <div className={`text-sm font-semibold ${active ? 'text-purple-200' : 'text-[#E0E3FF]'}`}>{cfg.label}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {c === 'meta_ads' ? 'Facebook + Instagram · notoriété et demande locale' : 'Recherche Google · intention d’achat existante'}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Objectif + budget + dates */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1.5">Objectif business</label>
            <select value={objective} onChange={e => setObjective(e.target.value as BusinessObjective)} className={inputClass}>
              {(Object.keys(BUSINESS_OBJECTIVES) as BusinessObjective[]).map(o => (
                <option key={o} value={o}>{BUSINESS_OBJECTIVES[o].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1.5">Budget total (€) <span className="text-red-400">*</span></label>
            <input type="text" inputMode="decimal" value={budget} onChange={e => setBudget(e.target.value)} placeholder="300" className={inputClass} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1.5">Début</label>
            <input type="date" value={startAt} onChange={e => setStartAt(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-1.5">Fin</label>
            <input type="date" value={endAt} onChange={e => setEndAt(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-300 block mb-1.5">Brief</label>
          <textarea
            value={brief}
            onChange={e => setBrief(e.target.value)}
            rows={3}
            placeholder={`Ex: Promouvoir ${selectedClient?.businessProfile?.mainOffers?.[0] || 'notre offre principale'} auprès des professionnels de la région. Mettre en avant les échantillons gratuits.`}
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-300 bg-red-950/30 border border-red-700/30 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 active:scale-[0.98] text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Génération du plan média…</>
          : <><Sparkles className="w-5 h-5" /> Créer la campagne et générer le plan</>}
      </button>
      {submitting && (
        <p className="text-center text-[11px] text-gray-400">
          Le Media Planner analyse le client et rédige les annonces — environ 15 à 30 secondes.
        </p>
      )}
    </div>
  )
}
