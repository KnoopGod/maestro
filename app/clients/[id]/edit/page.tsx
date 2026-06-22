import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getClient } from '@/lib/db/queries/clients'
import { updateClientAction } from '@/lib/actions/clients'
import {
  BUSINESS_OBJECTIVES,
  BUSINESS_TARGET_DELAYS,
  CLIENT_TYPES,
  CLIENT_STATUS,
  CONVERSION_CHANNELS,
  type BusinessObjective,
  type BusinessTargetDelay,
  type ClientType,
  type ClientStatus,
  type ConversionChannel,
} from '@/types/client'
import { VERTICAL_OPTIONS } from '@/lib/playbooks'

export const dynamic = 'force-dynamic'

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const client = await getClient(id)
  if (!client) notFound()

  const updateWithId = updateClientAction.bind(null, id)
  const businessProfile = client.businessProfile

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href={`/clients/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à {client.name}
      </Link>

      <div className="flex items-center gap-4">
        <div
          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${client.color} flex items-center justify-center text-2xl shadow-lg`}
        >
          {client.emoji}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Éditer le client</h1>
          <p className="text-sm text-gray-400">{client.name}</p>
        </div>
      </div>

      <form action={updateWithId} className="space-y-5">
        {/* Identité */}
        <fieldset className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 space-y-4">
          <legend className="text-sm font-semibold text-white px-1">Identité</legend>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
              Nom de l&apos;établissement
            </label>
            <input
              id="name"
              name="name"
              defaultValue={client.name}
              required
              className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-150"
            />
          </div>

          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1.5">
              Type
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {(Object.keys(CLIENT_TYPES) as ClientType[]).map(t => {
                const cfg = CLIENT_TYPES[t]
                return (
                  <label
                    key={t}
                    className="cursor-pointer aspect-square rounded-xl border border-gray-800 hover:border-purple-500 bg-gray-950/60 flex flex-col items-center justify-center gap-1 transition-all has-[:checked]:border-purple-500 has-[:checked]:bg-purple-900/20"
                  >
                    <input
                      type="radio"
                      name="type"
                      value={t}
                      defaultChecked={client.type === t}
                      className="sr-only peer"
                    />
                    <span className="text-2xl">{cfg.emoji}</span>
                    <span className="text-[11px] text-gray-400 peer-checked:text-purple-300 text-center px-1">
                      {cfg.label}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1.5">
              Statut
            </label>
            <select
              id="status"
              name="status"
              defaultValue={client.status}
              className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-150"
            >
              {(Object.keys(CLIENT_STATUS) as ClientStatus[]).map(s => (
                <option key={s} value={s}>
                  {CLIENT_STATUS[s].label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-1.5">
              Ville
            </label>
            <input
              id="city"
              name="city"
              defaultValue={client.city ?? ''}
              className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-150"
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
              defaultValue={client.description ?? ''}
              rows={2}
              className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 resize-none transition-all duration-150"
            />
          </div>

          <div id="clientSummary">
            <label htmlFor="clientSummary" className="block text-xs text-gray-400 mb-1.5">
              Résumé compris par l&apos;outil
            </label>
            <textarea
              id="clientSummary"
              name="clientSummary"
              defaultValue={client.clientSummary ?? ''}
              rows={5}
              placeholder="Ex: Guesthouse premium à Koh Samui, atmosphère tropicale calme, clientèle couple/famille, objectif de réservations directes via Facebook et Instagram..."
              title="Résumé opérationnel relu par les agents avant de proposer une stratégie, un texte ou une image"
              className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500 resize-y"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Ce champ sert de mémoire courte éditable : ce que les agents doivent comprendre du client avant de créer.
            </p>
          </div>
        </fieldset>

        {/* Business profile */}
        <fieldset className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 space-y-4">
          <legend className="text-sm font-semibold text-white px-1">Profil business</legend>
          <p className="text-xs text-gray-500 -mt-2">
            Objectif commercial, offres, canaux de conversion et contraintes qui guident les agents.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="businessVertical" className="block text-xs text-gray-400 mb-1.5">Verticale métier</label>
              <select
                id="businessVertical"
                name="businessVertical"
                defaultValue={businessProfile?.vertical ?? client.type}
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
                defaultValue={businessProfile?.priorityObjective ?? 'attract_new_customers'}
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
              defaultValue={listValue(businessProfile?.mainOffers)}
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
                defaultValue={businessProfile?.avgBasketEur ?? ''}
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
                defaultValue={businessProfile?.monthlyRevenueEur ?? ''}
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
                defaultValue={listValue(businessProfile?.peakDays)}
                placeholder="Ex: vendredi, samedi"
                className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label htmlFor="offDays" className="block text-xs text-gray-400 mb-1.5">Jours creux</label>
              <input
                id="offDays"
                name="offDays"
                defaultValue={listValue(businessProfile?.offDays)}
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
                    defaultChecked={(businessProfile?.conversionChannels ?? ['instagram_dm']).includes(channel)}
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
                defaultValue={businessProfile?.targetDelay ?? '3m'}
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
                defaultValue={businessProfile?.seasonality ?? ''}
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
              defaultValue={listValue(businessProfile?.constraints)}
              placeholder="Ex: pas de promotions agressives, budget pub limité"
              className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label htmlFor="localCompetitors" className="block text-xs text-gray-400 mb-1.5">Concurrents locaux</label>
            <input
              id="localCompetitors"
              name="localCompetitors"
              defaultValue={listValue(businessProfile?.localCompetitors)}
              placeholder="Ex: Nom concurrent 1, Nom concurrent 2"
              className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500"
            />
          </div>
        </fieldset>

        {/* Notes internes */}
        <fieldset className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5">
          <legend className="text-sm font-semibold text-white px-1">Notes internes</legend>
          <div className="mt-3">
            <label htmlFor="internalNotes" className="block text-xs text-gray-400 mb-1.5">
              Notes agence (non visibles par le client)
            </label>
            <textarea
              id="internalNotes"
              name="internalNotes"
              defaultValue={client.internalNotes ?? ''}
              rows={4}
              placeholder="Ex: Client contacté le 12/06, préfère les publications le vendredi soir. Éviter de mentionner la concurrence directe. Budget limité — max 3 posts/sem."
              className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-500 resize-y"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Informations opérationnelles internes : contacts, contraintes, historique agence. Jamais transmises aux agents IA.
            </p>
          </div>
        </fieldset>

        {/* Brand voice */}
        <fieldset className="bg-gray-900/40 border border-gray-800 rounded-2xl p-5 space-y-4">
          <legend className="text-sm font-semibold text-white px-1">Voix de marque</legend>

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
              defaultValue={client.brandVoiceTone ?? ''}
              placeholder="Ex: Convivial, chaleureux, passionné"
              className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-150"
            />
          </div>

          <div>
            <label
              htmlFor="brandVoiceKeywords"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Mots-clés à utiliser (séparés par virgules)
            </label>
            <input
              id="brandVoiceKeywords"
              name="brandVoiceKeywords"
              defaultValue={client.brandVoiceKeywords ?? ''}
              placeholder="authentique, fait maison, tradition"
              className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-150"
            />
          </div>

          <div>
            <label
              htmlFor="brandVoiceAvoid"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Mots à éviter
            </label>
            <input
              id="brandVoiceAvoid"
              name="brandVoiceAvoid"
              defaultValue={client.brandVoiceAvoid ?? ''}
              placeholder="corporate, froid, technique"
              className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-150"
            />
          </div>
        </fieldset>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Link
            href={`/clients/${id}`}
            className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 hover:border-gray-600 text-sm transition-all duration-150 active:scale-[0.98]"
          >
            Annuler
          </Link>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 active:scale-[0.98] text-white text-sm font-medium transition-all duration-150"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  )
}

function listValue(value: string[] | undefined) {
  return value?.join(', ') ?? ''
}
