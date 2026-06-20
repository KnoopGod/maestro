'use client'
import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import type { Post } from '@/types/post'

export function EditableHashtagChips({
  postId,
  hashtags,
  onPostUpdated,
}: {
  postId: string
  hashtags: string[]
  onPostUpdated: (post: Post) => void
}) {
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const normalized = hashtags.map(tag => tag.replace(/^#/, '')).filter(Boolean)

  async function save(nextHashtags: string[]) {
    setSaving(true)
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ hashtags: nextHashtags }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur hashtags')
      onPostUpdated(data.post)
      setDraft('')
    } finally {
      setSaving(false)
    }
  }

  function addTag() {
    const tag = draft.replace(/^#/, '').trim()
    if (!tag || normalized.includes(tag)) return
    void save([...normalized, tag])
  }

  return (
    <div className="border-t border-gray-800 bg-gray-950/30 px-5 py-4">
      <div className="mb-2.5 text-[10px] uppercase tracking-wider text-gray-500 font-medium">Hashtags éditables</div>
      <div className="flex flex-wrap gap-2">
        {normalized.map(tag => (
          <span
            key={tag}
            className="group inline-flex items-center gap-1 rounded-full border border-indigo-700/40 bg-indigo-900/40 px-2.5 py-1 text-xs text-indigo-300 hover:bg-indigo-800/40 hover:border-indigo-600/60 transition-colors"
          >
            #{tag}
            <button
              type="button"
              onClick={() => save(normalized.filter(item => item !== tag))}
              disabled={saving}
              title={`Supprimer #${tag}`}
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 rounded-full hover:text-red-300 disabled:opacity-30 cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <div className="inline-flex items-center gap-1.5">
          <input
            value={draft}
            onChange={event => setDraft(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addTag()
              }
            }}
            disabled={saving}
            placeholder="+ Hashtag"
            className="h-7 w-28 rounded-full border border-gray-800 bg-gray-900/60 px-3 text-xs text-gray-200 placeholder:text-gray-600 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 disabled:opacity-40 transition-colors"
          />
          <button
            type="button"
            onClick={addTag}
            disabled={saving || !draft.trim()}
            title="Ajouter ce hashtag"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-700 text-gray-400 hover:bg-indigo-900/40 hover:border-indigo-700/50 hover:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-[0.97]"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
