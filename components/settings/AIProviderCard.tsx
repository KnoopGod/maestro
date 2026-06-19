import Link from 'next/link'
import { AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react'
import type { AIProviderStatus } from '@/lib/ai/types'

const CATEGORY_LABELS: Record<AIProviderStatus['category'], string> = {
  text: 'Texte',
  image: 'Image',
  video: 'Vidéo',
  local: 'Local',
}

export function AIProviderCard({ provider }: { provider: AIProviderStatus }) {
  return (
    <article className={`rounded-2xl border p-4 ${
      provider.configured
        ? 'border-emerald-800/40 bg-emerald-950/15'
        : provider.status === 'active'
          ? 'border-amber-800/40 bg-amber-950/15'
          : 'border-gray-800 bg-gray-950/40'
    }`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">{provider.name}</h3>
            <span className="rounded-full border border-gray-700 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gray-400">
              {CATEGORY_LABELS[provider.category]}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {provider.bestFor.slice(0, 2).join(' · ')}
          </p>
        </div>
        {provider.configured ? (
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-400" />
        ) : (
          <AlertCircle className={`h-5 w-5 flex-shrink-0 ${provider.status === 'active' ? 'text-amber-400' : 'text-gray-600'}`} />
        )}
      </div>

      <div className="space-y-2 text-xs">
        <InfoRow label="Modèle défaut" value={provider.defaultModel} />
        <InfoRow label="Capacités" value={provider.capabilities.join(', ')} />
        <InfoRow
          label="Statut"
          value={provider.configured ? 'Connecté' : provider.status === 'active' ? `Manque ${provider.missingEnvVars.join(', ')}` : 'Prévu plus tard'}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {provider.models.slice(0, 2).map(model => (
          <span key={model.id} className="rounded-full border border-gray-800 bg-gray-950 px-2 py-1 text-[10px] text-gray-400">
            {model.label}
          </span>
        ))}
      </div>

      {provider.consoleUrl ? (
        <Link
          href={provider.consoleUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:underline"
        >
          Console provider
          <ExternalLink className="h-3 w-3" />
        </Link>
      ) : null}
    </article>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-gray-600">{label}</div>
      <div className="mt-0.5 text-gray-300">{value}</div>
    </div>
  )
}
