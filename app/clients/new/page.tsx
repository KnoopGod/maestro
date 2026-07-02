import Link from 'next/link'
import { nanoid } from 'nanoid'
import { ArrowLeft } from 'lucide-react'
import { createClientAction } from '@/lib/actions/clients'
import {
  BUSINESS_TARGET_DELAYS,
  type BusinessTargetDelay,
} from '@/types/client'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { BusinessProfileSelectors } from '@/components/clients/BusinessProfileSelectors'

export const dynamic = 'force-dynamic'

export default function NewClientPage() {
  const draftClientId = nanoid(12)

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux clients
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-white">Nouveau client</h1>
        <p className="text-sm text-gray-400 mt-1">
          Renseignez les infos de base — la brand voice sera affinée automatiquement après quelques posts.
        </p>
      </div>

      <form action={createClientAction} className="space-y-6">
        <input type="hidden" name="clientId" value={draftClientId} />

        {/* Identité */}
        <fieldset className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 space-y-4">
          <legend className="text-sm font-semibold text-white px-1">Identité</legend>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Nom de l&apos;établissement <span className="text-red-400">*</span>
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="Ex: Le Bistrot de Marie"
              className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-150"
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-1.5">
              Ville
            </label>
            <input
              id="city"
              name="city"
              placeholder="Ex: Lyon"
              className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-150"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Description courte
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              placeholder="Ex: Restaurant italien convivial · cuisine artisanale · pâte fermentée 72h"
              className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 resize-none transition-all duration-150"
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

          <BusinessProfileSelectors />

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
          <legend className="text-sm font-semibold text-white px-1">
            Voix de marque (optionnel)
          </legend>
          <p className="text-xs text-gray-400 -mt-2">
            L&apos;agent IA peut détecter automatiquement la brand voice à partir des comptes
            existants. Vous pouvez aussi la renseigner ici.
          </p>

          <div>
            <label
              htmlFor="brandVoiceTone"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Ton
            </label>
            <input
              id="brandVoiceTone"
              name="brandVoiceTone"
              placeholder="Ex: Convivial, chaleureux, passionné"
              className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-150"
            />
          </div>

          <div>
            <label
              htmlFor="brandVoiceKeywords"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Mots-clés (séparés par virgules)
            </label>
            <input
              id="brandVoiceKeywords"
              name="brandVoiceKeywords"
              placeholder="Ex: authentique, fait maison, tradition italienne"
              className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-150"
            />
          </div>
        </fieldset>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Link
            href="/clients"
            className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600 text-sm transition-all duration-150 active:scale-[0.98]"
          >
            Annuler
          </Link>
          <SubmitButton label="Créer le client" pendingLabel="Création en cours..." />
        </div>
      </form>
    </div>
  )
}
