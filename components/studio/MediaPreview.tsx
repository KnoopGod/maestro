import type { ContentType } from '@/lib/studio/types'

export function MediaPreview({
  imageUrl,
  contentType,
  fallbackEmoji,
  className,
}: {
  imageUrl?: string | null
  contentType: ContentType
  fallbackEmoji: string
  className: string
}) {
  if (!imageUrl) {
    return (
      <div className={`${className} bg-gradient-to-br from-purple-100 via-pink-100 to-amber-100 flex items-center justify-center text-6xl`}>
        {fallbackEmoji}
      </div>
    )
  }

  if (contentType === 'reel') {
    return (
      <div className={`${className} relative overflow-hidden bg-black`}>
        <video
          src={imageUrl}
          controls
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  return (
    <div className={`${className} relative overflow-hidden group`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="Aperçu du post"
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 pointer-events-none" />
    </div>
  )
}
