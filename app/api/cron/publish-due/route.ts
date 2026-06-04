/**
 * Cron endpoint — publishes all posts whose scheduled_at is past.
 *
 * Manual trigger : POST /api/cron/publish-due
 * Production : wire to Vercel Cron, GitHub Actions, or any external scheduler.
 *
 * If CRON_SECRET is set in env, requests must include
 *   `Authorization: Bearer <CRON_SECRET>` (Vercel Cron sends this automatically).
 */
import { NextRequest, NextResponse } from 'next/server'
import { listDuePosts, markPostFailed } from '@/lib/db/queries/posts'
import { publishPost, PublishBlockedError } from '@/lib/agents/publish-pipeline'

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authorizedBySession = await hasValidCODEXRSSession(req)
  if (!secret && !authorizedBySession) {
    return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 500 })
  }
  const auth = req.headers.get('authorization') || ''
  const expected = `Bearer ${secret}`
  const authorizedByCron = Boolean(secret) && timingSafeEqual(auth, expected)
  if (!authorizedByCron && !authorizedBySession) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const due = await listDuePosts()
  const results: Array<{ postId: string; status: 'published' | 'failed' | 'blocked'; error?: string }> = []

  for (const post of due) {
    try {
      // Cron re-runs supervision (cheap protection vs. drift since last review).
      const outcome = await publishPost(post)
      results.push({ postId: outcome.post.id, status: 'published' })
    } catch (err) {
      if (err instanceof PublishBlockedError) {
        results.push({ postId: post.id, status: 'blocked', error: err.review.summary })
        continue
      }
      const message = err instanceof Error ? err.message : 'Erreur publication'
      await markPostFailed(post.id, message).catch(() => undefined)
      results.push({ postId: post.id, status: 'failed', error: message })
    }
  }

  return NextResponse.json({ count: due.length, results })
}

// Convenience GET for manual testing in a browser
export async function GET(req: NextRequest) {
  return POST(req)
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

async function hasValidCODEXRSSession(req: NextRequest) {
  const password = process.env.CODEXRS_PASSWORD
  if (!password) return false

  const sessionCookie = req.cookies.get('codexrs_session')?.value
  if (!sessionCookie) return false

  const expected = await signSessionToken(password)
  return timingSafeEqual(sessionCookie, expected)
}

async function signSessionToken(password: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('codexrs-session'))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}
