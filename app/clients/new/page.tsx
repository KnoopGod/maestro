import Link from 'next/link'
import { nanoid } from 'nanoid'
import { ArrowLeft } from 'lucide-react'
import { createClientAction } from '@/lib/actions/clients'
import { CLIENT_TYPES, type ClientType } from '@/types/client'

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
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium"
          >
            Créer le client
          </button>
        </div>
      </form>
    </div>
  )
}
