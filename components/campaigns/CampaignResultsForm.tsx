'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Save } from 'lucide-react'
import type { Campaign } from '@/types/campaign'

function formatEur(value: number): string {
  return value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
}

/**
 * Saisie des résultats depuis Ads Manager / Google Ads (Phase 1 : manuel)
 * + calculs CPC / CPL / ROAS. Aucune valeur inventée : « — » si donnée absente.
 */
export function CampaignResultsForm({ campaign }: { campaign: Campaign }) {
  const router = useRouter()
  const r = campaign.results
  const [spend, setSpend] = useState(r?.spendEur?.toString() ?? '')
  const [impressions, setImpressions] = useState(r?.impressions?.toString() ?? '')
  const [clicks, setClicks] = useState(r?.clicks?.toString() ?? '')
  const [leads, setLeads] = useState(r?.leads?.toString() ?? '')
  const [revenue, setRevenue] = useState(r?.revenueEur?.toString() ?? '')
  const [notes, setNotes] = useState(r?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const spendNum = parseFloat(spend.replace(',', '.'))
  const clicksNum = parseInt(clicks, 10)
  const leadsNum = parseInt(leads, 10)
  const revenueNum = parseFloat(revenue.replace(',', '.'))

  const cpc = Number.isFinite(spendNum) && Number.isFinite(clicksNum) && clicksNum > 0
    ? spendNum / clicksNum : null
  const cpl = Number.isFinite(spendNum) && Number.isFinite(leadsNum) && leadsNum > 0
    ? spendNum / leadsNum : null
  const roas = Number.isFinite(spendNum) && spendNum > 0 && Number.isFinite(revenueNum) && revenueNum > 0
    ? revenueNum / spendNum : null

  async function save() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          results: {
            spendEur: spend.trim() || null,
            impressions: impressions.trim() || null,
            clicks: clicks.trim() || null,
            leads: leads.trim() || null,
            revenueEur: revenue.trim() || null,
            notes: notes.trim() || null,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur enregistrement')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-[#E0E3FF] placeholder:text-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-all duration-150'

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-800">
        <h2 className="text-base font-semibold text-[#E0E3FF]">Résultats de la campagne</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          À reporter depuis {campaign.channel === 'meta_ads' ? 'Meta Ads Manager' : 'Google Ads'} — MAESTRO calcule le retour sur investissement.
        </p>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-gray-500 block mb-1">Dépense (€)</span>
            <input type="text" inputMode="decimal" value={spend} onChange={e => setSpend(e.target.value)} placeholder="0" className={inputClass} />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-gray-500 block mb-1">Impressions</span>
            <input type="text" inputMode="numeric" value={impressions} onChange={e => setImpressions(e.target.value)} placeholder="0" className={inputClass} />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-gray-500 block mb-1">Clics</span>
            <input type="text" inputMode="numeric" value={clicks} onChange={e => setClicks(e.target.value)} placeholder="0" className={inputClass} />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-gray-500 block mb-1">Leads / conversions</span>
            <input type="text" inputMode="numeric" value={leads} onChange={e => setLeads(e.target.value)} placeholder="0" className={inputClass} />
          </label>
          <label className="block col-span-2 sm:col-span-1">
            <span className="text-[11px] uppercase tracking-wider text-gray-500 block mb-1">CA attribué (€)</span>
            <input type="text" inputMode="decimal" value={revenue} onChange={e => setRevenue(e.target.value)} placeholder="Déclaré par le client" className={inputClass} />
          </label>
        </div>

        <label className="block">
          <span className="text-[11px] uppercase tracking-wider text-gray-500 block mb-1">Notes</span>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Observations, audiences gagnantes, enseignements…" className={`${inputClass} resize-none`} />
        </label>

        {/* Métriques calculées */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-[#E0E3FF] font-mono">{cpc !== null ? `${formatEur(cpc)} €` : '—'}</div>
            <div className="text-[11px] uppercase tracking-wider text-gray-500 mt-0.5" title="Coût par clic = dépense / clics">CPC</div>
          </div>
          <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-[#E0E3FF] font-mono">{cpl !== null ? `${formatEur(cpl)} €` : '—'}</div>
            <div className="text-[11px] uppercase tracking-wider text-gray-500 mt-0.5" title="Coût par lead = dépense / leads">CPL</div>
          </div>
          <div className={`border rounded-xl p-3 text-center ${roas !== null && roas >= 1 ? 'bg-emerald-950/20 border-emerald-800/40' : 'bg-gray-950/60 border-gray-800'}`}>
            <div className={`text-xl font-bold font-mono ${roas !== null ? (roas >= 1 ? 'text-emerald-300' : 'text-red-300') : 'text-[#E0E3FF]'}`}>
              {roas !== null ? `×${roas.toFixed(1)}` : '—'}
            </div>
            <div className="text-[11px] uppercase tracking-wider text-gray-500 mt-0.5" title="Retour sur investissement publicitaire = CA attribué / dépense">ROAS</div>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-300 bg-red-950/30 border border-red-700/30 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 active:scale-[0.98] text-white text-sm font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? 'Enregistré ✓' : 'Enregistrer les résultats'}
          </button>
        </div>
      </div>
    </div>
  )
}
