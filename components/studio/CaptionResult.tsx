'use client'
import { useState } from 'react'
import { Copy, Check, Heart, MessageCircle, Send, Bookmark } from 'lucide-react'
import type { Post } from '@/types/post'
import type { GeneratedCaption, ContentType } from '@/lib/studio/types'
import { PLATFORM_INFO } from '@/lib/studio/types'
import { MediaPreview } from './MediaPreview'
import { EditableHashtagChips } from './EditableHashtagChips'
import { formatHostname } from '@/lib/studio/brief-utils'
import { getMetaCtaLabel } from '@/lib/meta-cta-types'

export function CaptionResult({
  postId,
  caption,
  clientEmoji,
  clientName,
  imageUrl,
  contentType,
  ctaType,
  ctaUrl,
  onPostUpdated,
}: {
  postId: string
  caption: GeneratedCaption
  clientEmoji: string
  clientName: string
  imageUrl?: string | null
  contentType: ContentType
  ctaType?: string | null
  ctaUrl?: string | null
  onPostUpdated: (post: Post) => void
}) {
  const [copied, setCopied] = useState(false)
  const cfg = PLATFORM_INFO[caption.platform]
  const pageSlug = clientName.toLowerCase().replace(/\s+/g, '') || 'client'

  const handleCopy = () => {
    const fullText = caption.caption + '\n\n' + caption.hashtags.map(h => `#${h.replace(/^#/, '')}`).join(' ')
    navigator.clipboard.writeText(fullText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-3 border-b border-gray-800 flex items-center justify-between ${cfg.color.replace('text-', 'bg-').replace('/20', '/10')}`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{cfg.emoji}</span>
          <span className="text-sm font-semibold text-white">{cfg.label}</span>
          <span className="text-[11px] text-gray-500">· {caption.characterCount} caractères</span>
        </div>
        <button
          onClick={handleCopy}
          title={`Copier le texte complet et les hashtags pour ${cfg.label}`}
          className="text-xs px-2.5 py-1 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 flex items-center gap-1"
        >
          {copied ? <><Check className="w-3 h-3 text-green-400" /> Copié</> : <><Copy className="w-3 h-3" /> Copier</>}
        </button>
      </div>

      {caption.platform === 'instagram' ? (
        <div className="bg-white">
          <div className="flex items-center gap-3 p-3 border-b border-gray-200">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-600 to-red-700 flex items-center justify-center text-base">
              {clientEmoji}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">{pageSlug}</div>
            </div>
          </div>
          <MediaPreview imageUrl={imageUrl} contentType={contentType} fallbackEmoji={clientEmoji} className="aspect-square" />
          <div className="p-3 text-gray-900">
            <div className="flex items-center gap-4 mb-2">
              <Heart className="w-6 h-6" />
              <MessageCircle className="w-6 h-6" />
              <Send className="w-6 h-6" />
              <Bookmark className="w-6 h-6 ml-auto" />
            </div>
            <div className="text-sm">
              <span className="font-semibold mr-1.5">{pageSlug}</span>
              {caption.caption}
              <div className="text-blue-700 mt-2">
                {caption.hashtags.map((h, i) => (
                  <span key={i} className="mr-1.5">#{h.replace(/^#/, '')}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : caption.platform === 'facebook' ? (
        <div className="bg-white text-gray-950">
          <div className="flex items-center gap-3 p-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-base">
              {clientEmoji}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight">{clientName || 'Page Facebook'}</div>
              <div className="text-xs text-gray-500">Maintenant · 🌐</div>
            </div>
          </div>
          <div className="px-3 pb-3 text-sm leading-relaxed">
            <p className="line-clamp-4">{caption.caption}</p>
            {caption.caption.length > 180 && <span className="text-gray-500">Voir plus</span>}
          </div>
          <MediaPreview imageUrl={imageUrl} contentType={contentType} fallbackEmoji={clientEmoji} className="aspect-[1.91/1]" />
          {ctaType && ctaUrl && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-100 px-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-[11px] uppercase tracking-wide text-gray-500">{formatHostname(ctaUrl)}</div>
                <div className="truncate text-sm font-semibold text-gray-900">{caption.cta || getMetaCtaLabel(ctaType)}</div>
              </div>
              <div className="ml-3 rounded-md bg-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-800">
                {getMetaCtaLabel(ctaType)}
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 border-t border-gray-200 text-center text-xs font-medium text-gray-500">
            <div className="py-2">J&apos;aime</div>
            <div className="py-2">Commenter</div>
            <div className="py-2">Partager</div>
          </div>
        </div>
      ) : (
        <div className="p-5 space-y-3">
          <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{caption.caption}</div>
        </div>
      )}

      <EditableHashtagChips
        postId={postId}
        hashtags={caption.hashtags}
        onPostUpdated={onPostUpdated}
      />

      <div className="px-5 py-3 border-t border-gray-800 bg-gray-950/40 grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-gray-500">Hook :</span>{' '}
          <span className="text-purple-300 italic">&ldquo;{caption.hook}&rdquo;</span>
        </div>
        <div>
          <span className="text-gray-500">CTA :</span>{' '}
          <span className="text-emerald-300">{caption.cta}</span>
        </div>
      </div>
    </div>
  )
}
