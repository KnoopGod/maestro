'use client'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import type { Post } from '@/types/post'

export function CopyCaptionButton({ post }: { post: Post }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    const hashtags = post.hashtags.length > 0
      ? '\n\n' + post.hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')
      : ''
    const text = post.caption + hashtags
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for environments without clipboard API
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={copied ? 'Copié !' : 'Copier la caption et les hashtags dans le presse-papier'}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
        copied
          ? 'border-emerald-600/50 text-emerald-300 bg-emerald-950/20'
          : 'border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600'
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copié !' : 'Copier'}
    </button>
  )
}
