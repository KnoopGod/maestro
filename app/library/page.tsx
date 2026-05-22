import Link from 'next/link'
import { FolderOpen, Sparkles } from 'lucide-react'
import { listClients } from '@/lib/db/queries/clients'
import { listClientAssets } from '@/lib/db/queries/assets'

export const dynamic = 'force-dynamic'

export default async function LibraryPage() {
  const clients = await listClients()

  const clientsWithAssets = await Promise.all(
    clients.map(async c => {
      const assets = await listClientAssets(c.id)
      const images = assets.filter(a => a.type === 'image').slice(0, 4)
      return {
        client: c,
        totalAssets: assets.length,
        images,
      }
    })
  )

  const totalAssets = clientsWithAssets.reduce((s, x) => s + x.totalAssets, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <FolderOpen className="w-7 h-7 text-purple-400" />
          Library
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Bibliothèque centralisée · {totalAssets} éléments répartis sur {clients.length} clients
        </p>
      </div>

      {totalAssets === 0 ? (
        <div className="bg-gray-900/20 border border-dashed border-gray-700 rounded-2xl p-12 text-center">
          <FolderOpen className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400">Aucun asset dans la bibliothèque.</p>
          <p className="text-xs text-gray-600 mt-1">
            Uploade des photos/vidéos sur la page Bibliothèque de chaque client.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {clientsWithAssets.map(({ client, totalAssets, images }) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}/library`}
              className="bg-gray-900/40 border border-gray-800 rounded-2xl p-4 hover:border-purple-700/50 transition-all group"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${client.color} flex items-center justify-center text-base flex-shrink-0`}>
                  {client.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{client.name}</div>
                  <div className="text-[11px] text-gray-500">{totalAssets} éléments</div>
                </div>
              </div>

              {images.length > 0 ? (
                <div className="grid grid-cols-2 gap-1">
                  {images.map(img => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={img.id}
                      src={img.thumbnailUrl ?? img.url}
                      alt=""
                      className="aspect-square w-full object-cover rounded-md"
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-gray-950/60 rounded-lg p-6 text-center text-xs text-gray-600">
                  Aucune image
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      <Link
        href="/studio"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium"
      >
        <Sparkles className="w-4 h-4" />
        Créer un post
      </Link>
    </div>
  )
}
