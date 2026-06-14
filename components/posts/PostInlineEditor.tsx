'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Edit3, X, Check, Loader2, Sparkles } from 'lucide-react'
import type { Post } from '@/types/post'

interface Props {
  post: Post
}

export function PostInlineEditor({ post }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [caption, setCaption] = useState(post.caption)
  const [hashtagsRaw, setHashtagsRaw] = useState(post.hashtags.join(' '))
  const [hook, setHook] = useState(post.hook ?? '')
  const [cta, setCta] = useState(post.cta ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [regenInstruction, setRegenInstruction] = useState('')
  const [showRegen, setShowRegen] = useState(false)

  function reset() {
    setCaption(post.caption)
    setHashtagsRaw(post.hashtags.join(' '))
    setHook(post.hook ?? '')
    setCta(post.cta ?? '')
    setError(null)
    setOpen(false)
    setShowRegen(false)
    setRegenInstruction('')
  }

  function regenerate() {
    startTransition(async () => {
      setError(null)
      const res = await fetch(`/api/posts/${post.id}/regenerate-caption`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: regenInstruction.trim() || undefined }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((d as { error?: string }).error ?? 'Erreur de régénération')
        return
      }
      const updated = (d as { post?: Post }).post
      if (updated) {
        setCaption(updated.caption)
        setHashtagsRaw(updated.hashtags.join(' '))
        setHook(updated.hook ?? '')
        setCta(updated.cta ?? '')
      }
      setShowRegen(false)
      setRegenInstruction('')
    })
  }

  function parseHashtags(raw: string): string[] {
    return raw
      .split(/[\s,]+/)
      .map(t => t.replace(/^#/, '').trim())
      .filter(Boolean)
      .slice(0, 20)
  }

  function save() {
    startTransition(async () => {
      setError(null)
      const res = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: caption.trim(),
          hashtags: parseHashtags(hashtagsRaw),
          hook: hook.trim() || null,
          cta: cta.trim() || null,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError((d as { error?: string }).error ?? 'Erreur de sauvegarde')
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm transition-colors"
      >
        <Edit3 className="w-3.5 h-3.5" />
        Éditer le texte
      </button>
    )
  }

  return (
    <div className="space-y-3 pt-1">
      <div>
        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Caption</label>
        <textarea
          value={caption}
          onChange={e => setCaption(e.target.value)}
          rows={5}
          maxLength={2200}
          className="w-full bg-gray-950 border border-gray-700 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white resize-none outline-none"
        />
        <p className="text-[10px] text-gray-600 mt-0.5 text-right">{caption.length}/2200</p>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Hashtags</label>
        <input
          type="text"
          value={hashtagsRaw}
          onChange={e => setHashtagsRaw(e.target.value)}
          placeholder="#horeca #restaurant …"
          className="w-full bg-gray-950 border border-gray-700 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
        />
        <p className="text-[10px] text-gray-600 mt-0.5">{parseHashtags(hashtagsRaw).length} hashtag(s) · séparés par espace ou virgule</p>
      </div>

      {post.hook !== undefined && (
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">Hook</label>
          <input
            type="text"
            value={hook}
            onChange={e => setHook(e.target.value)}
            placeholder="Accroche initiale…"
            className="w-full bg-gray-950 border border-gray-700 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
          />
        </div>
      )}

      {post.cta !== undefined && (
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-gray-500 mb-1">CTA</label>
          <input
            type="text"
            value={cta}
            onChange={e => setCta(e.target.value)}
            placeholder="Appel à l'action…"
            className="w-full bg-gray-950 border border-gray-700 focus:border-purple-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
          />
        </div>
      )}

      {/* AI Regen */}
      {showRegen ? (
        <div className="space-y-2 border border-purple-700/30 rounded-lg bg-purple-950/10 p-3">
          <label className="block text-[10px] uppercase tracking-widest text-purple-400 mb-1">Instruction pour la régénération IA</label>
          <textarea
            value={regenInstruction}
            onChange={e => setRegenInstruction(e.target.value)}
            placeholder="Ex: Rendre le ton plus décontracté, ajouter une accroche humoristique…"
            rows={2}
            className="w-full bg-gray-950 border border-gray-700 focus:border-purple-500 rounded-lg px-3 py-2 text-xs text-white resize-none outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={regenerate}
              disabled={isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-xs font-medium transition-colors"
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Régénérer
            </button>
            <button
              type="button"
              onClick={() => { setShowRegen(false); setRegenInstruction('') }}
              disabled={isPending}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowRegen(true)}
          className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
        >
          <Sparkles className="w-3 h-3" />
          Régénérer avec l&apos;IA
        </button>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={isPending || !caption.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
        >
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Sauvegarder
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:text-gray-200 text-sm transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Annuler
        </button>
      </div>
    </div>
  )
}
