import Link from 'next/link'
import { nanoid } from 'nanoid'
import { ArrowLeft } from 'lucide-react'
import { createClientAction } from '@/lib/actions/clients'
import {
  BUSINESS_OBJECTIVES,
  BUSINESS_TARGET_DELAYS,
  CLIENT_TYPES,
  CONVERSION_CHANNELS,
  type BusinessObjective,
  type BusinessTargetDelay,
  type ClientType,
  type ConversionChannel,
} from '@/types/client'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { VERTICAL_OPTIONS } from '@/lib/playbooks'

export const dynamic = 'force-dynamic'

export default function NewClientPage() {
  const draftClientId = nanoid(12)

  return (
    <div className="max-w-2xl space-y-6">
      <Link href="/clients" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Retour aux clients
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-white">Nouveau client</h1>
        <p className="text-sm text-gray-500 mt-1">
          Renseignez les infos de base — la brand voice sera affinée automatiquement après quelques posts.
        </p>
      </div>

      <form action={createClientAction} className="space-y-6">
        <input type="hidden" name="clientId" value={draftClientId} />

        {/* Identité */}
        <fieldset className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 space-y-4">
          <legend className="text-sm font-semibold text-white px-1">Identité</legend>

          <div>
            <label htmlFor="name" className="block text-xs text-gray-400 mb-1.5">
              Nom de l&apos;établissement <span className="text-red-400">*</span>
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="Ex: Le Bistrot de Marie"
              className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-xs text-gray-400 mb-1.5">
              Type <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {(Object.keys(CLIENT_TYPES) as ClientType[]).map(t => {
                const cfg = CLIENT_TYPES[t]
                return (
                  <label
                    key={t}
                    className="cursor-pointer aspect-square rounded-xl border border-gray-800 hover:border-purple-500 bg-gray-950/60 flex flex-col items-center justify-center gap-1 transition-all has-[:checked]:border-purple-500 has-[:checked]:bg-purple-900/20"
                  >
                    <input type="radio" name="type" value={t} required className="sr-only peer" />
                    <span className="text-2xl">{cfg.emoji}</span>
                    <span className="text-[10px] text-gray-400 peer-checked:text-purple-300 text-center px-1">{cfg.label}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <label htmlFor="city" className="block text-xs text-gray-400 mb-1.5">Ville</label>
            <input
              id="city"
              name="city"
              placeholder="Ex: Lyon"
              className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-xs text-gray-400 mb-1.5">Description courte</label>
            <textarea
              id="description"
              name="description"
              rows={2}
              placeholder="Ex: Restaurant italien convivial · cuisine artisanale · pâte fermentée 72h"
              className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <div>
            <label htmlFor="clientSummary" className="block text-xs text-gray-400 mb-1.5">
              Résumé compris par l&apos;outil
            </label>
            <textarea
              id="clientSummary"
              name="clientSummary"
              rows={4}
              placeholder="Ex: Guesthouse premium à Koh Samui, nouvelle DA fraîche et tropicale, objectif de réservations via Facebook et Instagram, contenu orienté expérience, plage, calme, accueil."
              title="Mémoire courte éditable que les agents utiliseront pour comprendre le client"
              className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500 resize-y"
            />
          </div>
        </fieldset>

        {/* Business profile */}
        <fieldset className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 space-y-4">
          <legend className="text-sm font-semibold text-white px-1">Profil business</legend>
          <p className="text-xs text-gray-500 -mt-2">
            Base de croissance : ce que le commerce vend, comment il convertit, et quel résultat Maestro doit viser.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="businessVertical" className="block text-xs text-gray-400 mb-1.5">Verticale métier</label>
              <select
                id="businessVertical"
                name="businessVertical"
                defaultValue="restaurant"
                className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {VERTICAL_OPTIONS.map(vertical => (
                  <option key={vertical.vertical} value={vertical.vertical}>
                    {vertical.emoji} {vertical.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="priorityObjective" className="block text-xs text-gray-400 mb-1.5">Objectif prioritaire</label>
              <select
                id="priorityObjective"
                name="priorityObjective"
                defaultValue="attract_new_customers"
                className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {(Object.keys(BUSINESS_OBJECTIVES) as BusinessObjective[]).map(objective => (
                  <option key={objective} value={objective}>{BUSINESS_OBJECTIVES[objective].label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="mainOffers" className="block text-xs text-gray-400 mb-1.5">Offres principales</label>
            <input
              id="mainOffers"
              name="mainOffers"
              placeholder="Ex: coupe femme, balayage, soin kératine"
              className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
            />
            <p className="text-[11px] text-gray-500 mt-1">Séparez par des virgules.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="avgBasketEur" className="block text-xs text-gray-400 mb-1.5">Panier moyen estimé (€)</label>
              <input
                id="avgBasketEur"
                name="avgBasketEur"
                inputMode="decimal"
                placeholder="Ex: 65"
                className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label htmlFor="monthlyRevenueEur" className="block text-xs text-gray-400 mb-1.5">CA mensuel de départ (€)</label>
              <input
                id="monthlyRevenueEur"
                name="monthlyRevenueEur"
                inputMode="decimal"
                placeholder="Optionnel"
                className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="peakDays" className="block text-xs text-gray-400 mb-1.5">Jours forts</label>
              <input
                id="peakDays"
                name="peakDays"
                placeholder="Ex: vendredi, samedi"
                className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label htmlFor="offDays" className="block text-xs text-gray-400 mb-1.5">Jours creux</label>
              <input
                id="offDays"
                name="offDays"
                placeholder="Ex: lundi, mardi"
                className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <div className="block text-xs text-gray-400 mb-2">Canaux de conversion</div>
            <div className="grid gap-2 sm:grid-cols-3">
              {(Object.keys(CONVERSION_CHANNELS) as ConversionChannel[]).map(channel => (
                <label key={channel} className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2 text-xs text-gray-300">
                  <input
                    type="checkbox"
                    name="conversionChannels"
                    value={channel}
                    defaultChecked={channel === 'instagram_dm'}
                    className="accent-purple-500"
                  />
                  {CONVERSION_CHANNELS[channel].label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="targetDelay" className="block text-xs text-gray-400 mb-1.5">Délai cible</label>
              <select
                id="targetDelay"
                name="targetDelay"
                defaultValue="3m"
                className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {(Object.keys(BUSINESS_TARGET_DELAYS) as BusinessTargetDelay[]).map(delay => (
                  <option key={delay} value={delay}>{BUSINESS_TARGET_DELAYS[delay].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="seasonality" className="block text-xs text-gray-400 mb-1.5">Saisonnalité</label>
              <input
                id="seasonality"
                name="seasonality"
                placeholder="Ex: forte demande été, creux janvier"
                className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="businessConstraints" className="block text-xs text-gray-400 mb-1.5">Contraintes business</label>
            <input
              id="businessConstraints"
              name="businessConstraints"
              placeholder="Ex: pas de promotions agressives, budget pub limité"
              className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
            />
          </div>
        </fieldset>

        {/* Brand voice */}
        <fieldset className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 space-y-4">
          <legend className="text-sm font-semibold text-white px-1">Voix de marque (optionnel)</legend>
          <p className="text-xs text-gray-500 -mt-2">
            L&apos;agent IA peut détecter automatiquement la brand voice à partir des comptes existants. Vous pouvez aussi la renseigner ici.
          </p>

          <div>
            <label htmlFor="brandVoiceTone" className="block text-xs text-gray-400 mb-1.5">Ton</label>
            <input
              id="brandVoiceTone"
              name="brandVoiceTone"
              placeholder="Ex: Convivial, chaleureux, passionné"
              className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label htmlFor="brandVoiceKeywords" className="block text-xs text-gray-400 mb-1.5">Mots-clés (séparés par virgules)</label>
            <input
              id="brandVoiceKeywords"
              name="brandVoiceKeywords"
              placeholder="Ex: authentique, fait maison, tradition italienne"
              className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
            />
          </div>
        </fieldset>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Link
            href="/clients"
            className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm"
          >
            Annuler
          </Link>
          <SubmitButton label="Créer le client" pendingLabel="Création en cours..." />
        </div>
      </form>
    </div>
  )
}
