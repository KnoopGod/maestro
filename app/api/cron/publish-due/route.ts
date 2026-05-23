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
  // Optional shared-secret guard
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization') || ''
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
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
