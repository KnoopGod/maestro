import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Sparkles, Star } from 'lucide-react'
import { getClient } from '@/lib/db/queries/clients'
import { listClientAssets, getVisualIdentity } from '@/lib/db/queries/assets'
import { UploadZone } from '@/components/library/UploadZone'
import { AssetGrid } from '@/components/library/AssetGrid'
import { AnalyzeDAButton } from '@/components/library/AnalyzeDAButton'

export const dynamic = 'force-dynamic'

export default async function LibraryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await getClient(id)
  if (!client) notFound()

  const [assets, identity] = await Promise.all([
    listClientAssets(id),
    getVisualIdentity(id),
  ])

  const stats = {
    total: assets.length,
    images: assets.filter(a => a.type === 'image').length,
    videos: assets.filter(a => a.type === 'video').length,
    documents: assets.filter(a => a.type === 'document' || a.type === 'brand_guide').length,
    starred: assets.filter(a => a.starred).length,
    analyzed: assets.filter(a => a.analyzedAt).length,
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Breadcrumb */}
      <Link href={`/clients/${client.id}`} title={`Retourner à la fiche de ${client.name}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Retour à {client.name}
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${client.color} flex items-center justify-center text-2xl shadow-lg`}>
            {client.emoji}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Bibliothèque · {client.name}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {stats.total} {stats.total > 1 ? 'éléments' : 'élément'} ·{' '}
              {stats.images} images · {stats.videos} vidéos · {stats.documents} documents
            </p>
          </div>
        </div>

        {stats.images >= 3 && (
          <AnalyzeDAButton clientId={client.id} hasIdentity={!!identity} />
        )}
      </div>

      {/* Visual Identity (if analyzed) */}
      {identity && identity.stylePrompt && (
        <div className="bg-gradient-to-br from-purple-950/40 to-pink-950/30 border border-purple-700/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              ✨ Identité visuelle détectée
            </h2>
            <span className="text-[10px] text-purple-300">
              Analysée le {identity.analyzedAt ? new Date(identity.analyzedAt).toLocaleDateString('fr-FR') : '—'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Mood</div>
                <div className="text-sm text-white capitalize">{identity.overallMood || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Lumière</div>
                <div className="text-sm text-white capitalize">{identity.lightingStyle || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Palette</div>
                <div className="flex gap-1.5">
                  {identity.palette.map((c, i) => (
                    <div key={i} className="w-8 h-8 rounded-lg border border-gray-700 shadow-lg" style={{ backgroundColor: c }} title={c} />
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Mots-clés style</div>
                <div className="flex flex-wrap gap-1">
                  {identity.styleKeywords.map((kw, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-purple-900/40 border border-purple-700/30 text-purple-300">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Synthèse visuelle</div>
              <p className="text-sm text-gray-300 leading-relaxed mb-4">{identity.visualSummary}</p>

              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2 mt-4">Style prompt (injecté dans les générations)</div>
              <div className="bg-gray-950/60 border border-gray-800 rounded-lg p-3 text-xs text-emerald-300 font-mono leading-relaxed">
                {identity.stylePrompt}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload zone */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">📤 Ajouter du contenu</h2>
        <UploadZone clientId={client.id} />
      </div>

      {/* Assets grid */}
      {assets.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/20 border border-dashed border-gray-800 rounded-2xl">
          <Sparkles className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500">
            Aucun contenu encore.
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Uploade au moins 5-10 photos pour que l&apos;agent puisse détecter la DA.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Filter pills */}
          <div className="flex gap-2 items-center">
            {stats.starred > 0 && (
              <button title="Afficher les ressources marquées comme références importantes de la DA" className="text-xs px-3 py-1.5 rounded-lg bg-yellow-900/40 border border-yellow-700/30 text-yellow-400 flex items-center gap-1.5">
                <Star className="w-3 h-3 fill-yellow-400" /> Favoris ({stats.starred})
              </button>
            )}
            <span className="text-xs text-gray-500">
              {stats.analyzed}/{stats.total} analysés par l&apos;IA
            </span>
          </div>

          <AssetGrid assets={assets} clientId={client.id} />
        </div>
      )}
    </div>
  )
}
