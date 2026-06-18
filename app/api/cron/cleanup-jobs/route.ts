/**
 * Cron endpoint — marque comme échoués les jobs restés en `running` depuis plus de 10 min.
 *
 * Cause : la fonction serverless Vercel est recyclée pendant un pipeline `after()`.
 * Le job reste bloqué indéfiniment sans ce balayage.
 *
 * Manuel : POST /api/cron/cleanup-jobs
 * Production : Vercel Cron — toutes les 15 minutes (voir vercel.json)
 */
import { NextRequest, NextResponse } from 'next/server'
import { listStaleJobs, completeAgentJob } from '@/lib/db/queries/agent-jobs'
import { markPostFailed } from '@/lib/db/queries/posts'
import { startCronExecution, completeCronExecution } from '@/lib/db/queries/cron-log'
import { timingSafeEqual } from '@/lib/auth/session'

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET manquant' }, { status: 500 })
  }

  const auth = req.headers.get('authorization') || ''
  if (!timingSafeEqual(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const exec = await startCronExecution('cleanup-jobs').catch(() => null)
  const stale = await listStaleJobs()
  const results: Array<{ jobId: string; postId: string | null }> = []

  for (const job of stale) {
    await completeAgentJob(job.id, { status: 'failed' })
    if (job.postId) {
      await markPostFailed(job.postId, 'Job interrompu — fonction serverless recyclée avant la fin du pipeline')
    }
    results.push({ jobId: job.id, postId: job.postId })
  }

  if (exec) {
    await completeCronExecution(exec.id, {
      status: 'completed',
      processedCount: stale.length,
      results,
    }).catch(() => undefined)
  }

  console.log(`[cleanup-jobs] ${results.length} job(s) orphelin(s) nettoyés`)
  return NextResponse.json({ cleaned: results.length, jobs: results })
}
