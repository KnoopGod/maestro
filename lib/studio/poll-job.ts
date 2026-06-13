import type { JobProgress, JobProgressEvent, JobStatus } from './types'

const TERMINAL_STATUSES: ReadonlySet<JobStatus> = new Set(['completed', 'failed', 'awaiting_validation'])

interface PollJobOptions {
  /** Appelé à chaque tick avec l'état courant du job. */
  onProgress?: (progress: JobProgress) => void
  /** Permet d'annuler le polling (nouvelle génération, démontage du composant). */
  signal?: AbortSignal
  /** Intervalle entre deux requêtes de suivi (défaut 1500ms). */
  intervalMs?: number
  /** Délai max avant d'abandonner (défaut 5 min). */
  timeoutMs?: number
}

/**
 * Interroge `/api/agents/jobs/[id]` jusqu'à ce que le job atteigne un état terminal
 * (completed / failed / awaiting_validation), puis retourne l'état final.
 * Lève une AbortError si annulé, ou une Error si le délai max est dépassé.
 */
export async function pollJob(jobId: string, options: PollJobOptions = {}): Promise<JobProgress> {
  const interval = options.intervalMs ?? 1500
  const timeout = options.timeoutMs ?? 5 * 60 * 1000
  const start = Date.now()

  while (true) {
    if (options.signal?.aborted) throw new DOMException('Polling annulé', 'AbortError')

    const res = await fetch(`/api/agents/jobs/${jobId}`, { signal: options.signal })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Suivi de la génération impossible')
    }

    const { job } = await res.json()
    const progress: JobProgress = {
      status: job.status as JobStatus,
      postId: (job.postId as string | null) ?? null,
      events: (job.events ?? []).map((e: Record<string, unknown>): JobProgressEvent => ({
        agent: e.agent as string,
        sequence: e.sequence as number,
        status: e.status as JobProgressEvent['status'],
        taskLabel: e.taskLabel as string,
        outputSummary: (e.outputSummary as string | null) ?? null,
        errorMessage: (e.errorMessage as string | null) ?? null,
      })),
    }
    options.onProgress?.(progress)

    if (TERMINAL_STATUSES.has(progress.status)) return progress
    if (Date.now() - start > timeout) throw new Error('La génération a dépassé le temps imparti')

    await new Promise(resolve => setTimeout(resolve, interval))
  }
}

/** Extrait le message d'erreur le plus pertinent d'un job échoué. */
export function failureMessage(progress: JobProgress): string {
  const failed = progress.events.find(e => e.status === 'failed' && e.errorMessage)
  return failed?.errorMessage || 'La génération a échoué. Réessaie ou vérifie la configuration.'
}
