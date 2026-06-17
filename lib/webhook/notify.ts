interface WebhookPayload {
  event: 'post.published' | 'post.failed' | 'post.scheduled'
  timestamp: number
  post: {
    id: string
    clientName: string
    platforms?: string[]
    imageUrl?: string | null
    caption?: string
    hashtags?: string[]
    publishedAt?: number | null
    scheduledAt?: number | null
    error?: string | null
    cost?: number
  }
}

/**
 * Fires a non-blocking webhook to MAESTRO_WEBHOOK_URL when a post event occurs.
 * Silently swallows errors — the webhook must never affect the publishing flow.
 */
export async function notifyWebhook(payload: WebhookPayload): Promise<void> {
  const url = process.env.MAESTRO_WEBHOOK_URL
  if (!url) return

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-MAESTRO-Event': payload.event },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5_000),
    })
  } catch {
    // Non-blocking: webhook failures must never affect publishing
  }
}
