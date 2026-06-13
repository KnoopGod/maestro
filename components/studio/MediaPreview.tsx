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
      <video
        src={imageUrl}
        controls
        className={`${className} w-full bg-black object-cover`}
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt="Aperçu du post"
      loading="lazy"
      decoding="async"
      className={`${className} w-full object-cover`}
    />
  )
}
