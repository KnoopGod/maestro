'use client'
import { useState, useRef, useTransition } from 'react'
import { Upload, Loader2, Image as ImageIcon, FileText, Film, Palette, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ASSET_CATEGORIES, type AssetCategory } from '@/types/asset'

export function UploadZone({ clientId }: { clientId: string }) {
  const [category, setCategory] = useState<AssetCategory>('ambiance')
  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return
    setFiles(prev => [...prev, ...Array.from(fileList)])
    setError(null)
  }

  const upload = () => {
    if (files.length === 0) return
    setError(null)
    startTransition(async () => {
      try {
        const formData = new FormData()
        files.forEach(f => formData.append('files', f))
        formData.append('category', category)

        const res = await fetch(`/api/clients/${clientId}/assets`, {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Erreur upload')

        setFiles([])
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur')
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Category selector */}
      <div>
        <label className="text-xs text-gray-500 block mb-2">Catégorie pour les fichiers à uploader</label>
        <div className="grid grid-cols-6 gap-2">
          {(Object.keys(ASSET_CATEGORIES) as AssetCategory[]).map(cat => {
            const cfg = ASSET_CATEGORIES[cat]
            const active = category === cat
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                title={`Classer les prochains fichiers dans la catégorie ${cfg.label}`}
                className={`px-2 py-2 rounded-lg border text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                  active
                    ? 'bg-purple-600/20 border-purple-600/40 text-purple-300'
                    : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300'
                }`}
              >
                <span className="text-base">{cfg.emoji}</span>
                <span>{cfg.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={e => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault()
          setDragOver(false)
          handleFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        title="Cliquer pour choisir des fichiers ou glisser-déposer des ressources client ici"
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-purple-500 bg-purple-950/30'
            : 'border-gray-700 hover:border-purple-500 bg-gray-900/40'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*,application/pdf,.docx,.txt,.md"
          onChange={e => handleFiles(e.target.files)}
          className="hidden"
        />
        <Upload className="w-10 h-10 text-purple-400 mx-auto mb-3" />
        <p className="text-white font-medium">Glisser des fichiers ici</p>
        <p className="text-xs text-gray-500 mt-1">
          Images · Vidéos · PDF · DOCX · Markdown
        </p>
      </div>

      {/* File queue */}
      {files.length > 0 && (
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">{files.length} fichier{files.length > 1 ? 's' : ''} en attente</span>
            <button
              onClick={() => setFiles([])}
              title="Retirer tous les fichiers de la file d'attente avant upload"
              className="text-xs text-gray-500 hover:text-gray-300"
            >
              Tout vider
            </button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-gray-950/60 border border-gray-800 rounded-lg text-xs">
                <FileIcon mime={f.type} />
                <span className="text-gray-300 truncate flex-1">{f.name}</span>
                <span className="text-gray-600">{(f.size / 1024).toFixed(1)} KB</span>
                <button
                  onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                  title={`Retirer ${f.name} de la file d'attente`}
                  className="text-gray-600 hover:text-red-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {error && (
            <div className="text-xs text-red-400 mt-2">⚠ {error}</div>
          )}

          <button
            onClick={upload}
            disabled={isPending}
            title="Envoyer ces fichiers dans la Library du client pour alimenter sa DA et ses futurs posts"
            className="w-full mt-2 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium flex items-center justify-center gap-2"
          >
            {isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Upload en cours...</>
              : <><Upload className="w-4 h-4" /> Uploader {files.length} fichier{files.length > 1 ? 's' : ''}</>
            }
          </button>
        </div>
      )}
    </div>
  )
}

function FileIcon({ mime }: { mime: string }) {
  if (mime.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-pink-400 flex-shrink-0" />
  if (mime.startsWith('video/')) return <Film className="w-4 h-4 text-amber-400 flex-shrink-0" />
  if (mime === 'image/svg+xml') return <Palette className="w-4 h-4 text-purple-400 flex-shrink-0" />
  return <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
}
