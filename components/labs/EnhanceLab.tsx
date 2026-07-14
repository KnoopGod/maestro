'use client'

import { useState, useRef } from 'react'
import { Camera, Loader2, RefreshCw, Sparkles } from 'lucide-react'

interface EnhanceResult {
  enhanced: string
  promptUsed: string
  cost: number
  model: string
  durationMs: number
}

/**
 * Labo retouche — POC Snap Studio (spec 142).
 * Objectif : juger sur de vraies photos si la retouche IA sublime SANS dénaturer.
 */
export function EnhanceLab() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [result, setResult] = useState<EnhanceResult | null>(null)
  const [styleHint, setStyleHint] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function pickFile(selected: File | null) {
    if (!selected) return
    setFile(selected)
    setResult(null)
    setError('')
    if (originalUrl) URL.revokeObjectURL(originalUrl)
    setOriginalUrl(URL.createObjectURL(selected))
  }

  async function enhance() {
    if (!file || busy) return
    setBusy(true)
    setError('')
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('photo', file)
      if (styleHint.trim()) formData.append('styleHint', styleHint.trim())

      const res = await fetch('/api/labs/enhance', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`)
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur retouche')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Sélection photo */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={e => pickFile(e.target.files?.[0] ?? null)}
      />

      {!originalUrl ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full py-16 rounded-2xl border-2 border-dashed border-gray-700 hover:border-purple-500/60 bg-gray-900/40 flex flex-col items-center gap-3 transition-all duration-150 active:scale-[0.99]"
        >
          <Camera className="w-12 h-12 text-purple-400" />
          <span className="text-base font-medium text-[#E0E3FF]">Photographier un plat</span>
          <span className="text-xs text-gray-500">ou choisir une photo existante</span>
        </button>
      ) : (
        <>
          {/* Avant / Après */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <figure>
              <figcaption className="text-[11px] uppercase tracking-wider text-gray-500 mb-1.5">Avant — photo originale</figcaption>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={originalUrl} alt="Photo originale" className="w-full rounded-2xl border border-gray-800 object-contain" />
            </figure>
            <figure>
              <figcaption className="text-[11px] uppercase tracking-wider text-emerald-400 mb-1.5">Après — sublimée par l&apos;IA</figcaption>
              {result ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={result.enhanced} alt="Photo sublimée" className="w-full rounded-2xl border border-emerald-800/50 object-contain" />
              ) : (
                <div className="w-full aspect-square rounded-2xl border border-dashed border-gray-800 bg-gray-950/40 flex flex-col items-center justify-center gap-3 text-center px-6">
                  {busy ? (
                    <>
                      <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                      <span className="text-sm text-gray-400">Retouche en cours…</span>
                      <span className="text-[11px] text-gray-600">30 à 90 secondes — la fidélité haute prend son temps</span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-600">La version sublimée apparaîtra ici</span>
                  )}
                </div>
              )}
            </figure>
          </div>

          {/* Style hint optionnel */}
          <input
            type="text"
            value={styleHint}
            onChange={e => setStyleHint(e.target.value)}
            placeholder="Ambiance optionnelle — ex : chaleureux bistrot, tons bois et cuivre"
            className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2.5 text-sm text-[#E0E3FF] placeholder:text-gray-600 focus:outline-none focus:border-purple-500 transition-all duration-150"
          />

          {error && (
            <p className="text-xs text-red-300 bg-red-950/30 border border-red-700/30 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={enhance}
              disabled={busy}
              className="flex-1 min-w-[200px] py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 active:scale-[0.98] text-white font-semibold flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-40"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {result ? 'Réessayer (variance)' : 'Sublimer la photo'}
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="px-4 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 text-sm flex items-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-40"
            >
              <RefreshCw className="w-4 h-4" />
              Autre photo
            </button>
          </div>

          {result && (
            <div className="text-[11px] text-gray-500 font-mono flex flex-wrap gap-x-4 gap-y-1">
              <span>Durée : {(result.durationMs / 1000).toFixed(1)}s</span>
              <span>Coût estimé : ${result.cost.toFixed(3)}</span>
              <span>Modèle : {result.model}</span>
            </div>
          )}
        </>
      )}

      {/* Grille de jugement */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-[#E0E3FF] mb-2">Comment juger (5-10 vraies photos)</h2>
        <ul className="space-y-1.5 text-xs text-gray-400">
          <li>1. <span className="text-gray-300">Fidélité</span> — est-ce EXACTEMENT le même plat ? (ingrédients, portions, dressage, assiette)</li>
          <li>2. <span className="text-gray-300">Amélioration</span> — la version retouchée donne-t-elle vraiment plus envie ?</li>
          <li>3. <span className="text-gray-300">Naturel</span> — a-t-elle l&apos;air d&apos;une vraie photo pro, ou d&apos;une image IA ?</li>
          <li>4. <span className="text-gray-300">Variance</span> — relancer sur la même photo : le résultat reste-t-il stable ?</li>
        </ul>
        <p className="text-[11px] text-gray-600 mt-3">
          Verdict ≥ 7/10 photos fidèles et améliorées → on construit Snap Studio sur ce moteur.
          Sinon → approche hybride (retouche classique + IA au choix).
        </p>
      </div>
    </div>
  )
}
