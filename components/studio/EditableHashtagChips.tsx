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
    <div className="border-t border-gray-800 bg-gray-950/30 px-5 py-3">
      <div className="mb-2 text-[10px] uppercase tracking-wider text-gray-500">Hashtags éditables</div>
      <div className="flex flex-wrap gap-1.5">
        {normalized.map(tag => (
          <button
            key={tag}
            type="button"
            onClick={() => save(normalized.filter(item => item !== tag))}
            disabled={saving}
            title={`Supprimer #${tag}`}
            className="inline-flex items-center gap-1 rounded-full border border-blue-800/40 bg-blue-950/30 px-2 py-1 text-xs text-blue-300 hover:border-blue-500/60 disabled:opacity-40"
          >
            #{tag}
            <X className="h-3 w-3" />
          </button>
        ))}
        <div className="inline-flex items-center gap-1">
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
            placeholder="Ajouter"
            className="h-7 w-24 rounded-full border border-gray-800 bg-gray-900 px-2 text-xs text-gray-200 placeholder:text-gray-600 focus:border-blue-600 focus:outline-none disabled:opacity-40"
          />
          <button
            type="button"
            onClick={addTag}
            disabled={saving || !draft.trim()}
            title="Ajouter ce hashtag"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
