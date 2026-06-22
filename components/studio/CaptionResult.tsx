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
    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl overflow-hidden transition-all hover:border-gray-700">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between bg-gray-950/30">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{cfg.emoji}</span>
          <span className="text-sm font-semibold text-white">{cfg.label}</span>
          <span className="text-[11px] text-gray-500">· {caption.characterCount} caractères</span>
        </div>
        <button
          onClick={handleCopy}
          title={`Copier le texte complet et les hashtags pour ${cfg.label}`}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-200 hover:border-gray-600 flex items-center gap-1.5 transition-all duration-150 active:scale-[0.97]"
        >
          {copied
            ? <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Copié</span></>
            : <><Copy className="w-3 h-3" />Copier</>
          }
        </button>
      </div>

      {caption.platform === 'instagram' ? (
        <div className="bg-white">
          <div className="flex items-center gap-3 p-3 border-b border-gray-200">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-base flex-shrink-0 ring-2 ring-orange-400/30">
              {clientEmoji}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-gray-900">{pageSlug}</div>
            </div>
          </div>
          <MediaPreview imageUrl={imageUrl} contentType={contentType} fallbackEmoji={clientEmoji} className="aspect-square" />
          <div className="p-3 text-gray-900">
            <div className="flex items-center gap-4 mb-2.5">
              <Heart className="w-6 h-6 cursor-pointer hover:text-red-500 transition-colors" />
              <MessageCircle className="w-6 h-6 cursor-pointer hover:text-blue-500 transition-colors" />
              <Send className="w-6 h-6 cursor-pointer hover:text-blue-500 transition-colors" />
              <Bookmark className="w-6 h-6 ml-auto cursor-pointer hover:text-amber-500 transition-colors" />
            </div>
            <div className="text-sm leading-relaxed">
              <span className="font-semibold mr-1.5">{pageSlug}</span>
              {caption.caption}
              <div className="text-blue-600 mt-2 flex flex-wrap gap-x-1.5 gap-y-0.5">
                {caption.hashtags.map((h, i) => (
                  <span key={i} className="hover:underline cursor-pointer">#{h.replace(/^#/, '')}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : caption.platform === 'facebook' ? (
        <div className="bg-white text-gray-950">
          <div className="flex items-center gap-3 p-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-base flex-shrink-0">
              {clientEmoji}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold leading-tight">{clientName || 'Page Facebook'}</div>
              <div className="text-xs text-gray-500 mt-0.5">Maintenant · 🌐</div>
            </div>
          </div>
          <div className="px-3 pb-3 text-sm leading-relaxed">
            <p className="line-clamp-4">{caption.caption}</p>
            {caption.caption.length > 180 && <span className="text-blue-600 text-xs cursor-pointer">Voir plus</span>}
          </div>
          <MediaPreview imageUrl={imageUrl} contentType={contentType} fallbackEmoji={clientEmoji} className="aspect-[1.91/1]" />
          {ctaType && ctaUrl && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-3 py-2.5">
              <div className="min-w-0">
                <div className="truncate text-[11px] uppercase tracking-wide text-gray-400">{formatHostname(ctaUrl)}</div>
                <div className="truncate text-sm font-semibold text-gray-900 mt-0.5">{caption.cta || getMetaCtaLabel(ctaType)}</div>
              </div>
              <div className="ml-3 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white flex-shrink-0">
                {getMetaCtaLabel(ctaType)}
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 border-t border-gray-200 text-center text-xs font-medium text-gray-500">
            <div className="py-2.5 hover:bg-gray-50 cursor-pointer transition-colors">J&apos;aime</div>
            <div className="py-2.5 hover:bg-gray-50 cursor-pointer border-x border-gray-200 transition-colors">Commenter</div>
            <div className="py-2.5 hover:bg-gray-50 cursor-pointer transition-colors">Partager</div>
          </div>
        </div>
      ) : (
        <div className="p-5">
          <div className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{caption.caption}</div>
        </div>
      )}

      <EditableHashtagChips
        postId={postId}
        hashtags={caption.hashtags}
        onPostUpdated={onPostUpdated}
      />

      <div className="px-5 py-3.5 border-t border-gray-800 bg-gray-950/40 grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">Hook</div>
          <span className="text-xs text-purple-300 italic leading-relaxed">&ldquo;{caption.hook}&rdquo;</span>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-1">CTA</div>
          <span className="text-xs text-emerald-300 leading-relaxed">{caption.cta}</span>
        </div>
      </div>
    </div>
  )
}
