import { logWebhookDelivery } from '@/lib/db/queries/webhook-log'

export interface WebhookPayload {
  event: 'post.published' | 'post.failed' | 'post.scheduled' | 'portal.approved' | 'portal.changes_requested'
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
    portalComment?: string
  }
}

/**
 * Fires a non-blocking webhook to MAESTRO_WEBHOOK_URL when a post event occurs.
 * Silently swallows errors — the webhook must never affect the publishing flow.
 * Each attempt is logged to webhook_deliveries for debugging.
 */
export async function notifyWebhook(payload: WebhookPayload): Promise<void> {
  const url = process.env.MAESTRO_WEBHOOK_URL
  if (!url) return

  const start = Date.now()
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-MAESTRO-Event': payload.event },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5_000),
    })
    const durationMs = Date.now() - start
    await logWebhookDelivery({
      event: payload.event,
      payload,
      status: res.ok ? 'success' : 'failed',
      httpStatus: res.status,
      durationMs,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    }).catch(() => undefined)
  } catch (err) {
    const durationMs = Date.now() - start
    const isTimeout = err instanceof Error && err.name === 'TimeoutError'
    await logWebhookDelivery({
      event: payload.event,
      payload,
      status: isTimeout ? 'timeout' : 'failed',
      durationMs,
      error: err instanceof Error ? err.message : 'Unknown error',
    }).catch(() => undefined)
  }
}
