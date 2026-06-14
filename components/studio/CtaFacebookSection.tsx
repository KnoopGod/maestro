'use client'
import { META_CTA_TYPES, getMetaCtaLabel } from '@/lib/meta-cta-types'

interface Props {
  ctaType: string
  ctaUrl: string
  onCtaTypeChange: (v: string) => void
  onCtaUrlChange: (v: string) => void
}

export function CtaFacebookSection({ ctaType, ctaUrl, onCtaTypeChange, onCtaUrlChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[9px] text-indigo-600/60 font-mono tracking-[0.2em] uppercase">{'// CTA FACEBOOK'}</span>
        <span className="text-[8px] text-gray-600 font-mono">— bouton d&apos;action sur la publication</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select
          value={ctaType}
          onChange={e => onCtaTypeChange(e.target.value)}
          className="col-span-2 sm:col-span-1 bg-gray-900/60 border border-gray-800 text-xs text-gray-300 px-2 py-2 font-mono focus:outline-none focus:border-indigo-600"
        >
          <option value="">Aucun bouton CTA</option>
          {META_CTA_TYPES.map(cta => (
            <option key={cta.value} value={cta.value}>{cta.emoji} {cta.label}</option>
          ))}
        </select>
        {ctaType && (
          <input
            type="url"
            value={ctaUrl}
            onChange={e => onCtaUrlChange(e.target.value)}
            placeholder="https://votre-site.com/reserver"
            className="col-span-2 bg-gray-900/60 border border-gray-800 text-xs text-gray-300 px-2 py-2 font-mono placeholder:text-gray-700 focus:outline-none focus:border-indigo-600"
          />
        )}
      </div>
      {ctaType && !ctaUrl && (
        <p className="text-[9px] text-amber-500/70 font-mono">⚠ Entrez l&apos;URL de destination pour activer le bouton</p>
      )}
      {ctaType && ctaUrl && (
        <p className="text-[9px] text-emerald-500/60 font-mono">✓ Bouton &ldquo;{getMetaCtaLabel(ctaType)}&rdquo; activé → {ctaUrl.length > 40 ? ctaUrl.substring(0, 40) + '…' : ctaUrl}</p>
      )}
    </div>
  )
}
