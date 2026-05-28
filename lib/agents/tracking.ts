import {
  createAgentEvent,
  startAgentEvent,
  completeAgentEvent,
  type EventStatus,
} from '@/lib/db/queries/agent-jobs'

interface TrackMeta<T> {
  onComplete?: (result: T) => {
    outputSummary?: string
    outputData?: Record<string, unknown>
    cost?: number
  } | void
  onError?: (err: Error) => {
    errorMessage?: string
    errorAction?: string
  } | void
}

/** Wraps an agent call with DB tracking. Rethrows errors after marking the event as failed. */
export async function withTracking<T>(
  fn: () => Promise<T>,
  opts: { jobId: string; agent: string; sequence: number; taskLabel: string },
  meta?: TrackMeta<T>
): Promise<T> {
  const event = await createAgentEvent({
    jobId: opts.jobId,
    agent: opts.agent,
    sequence: opts.sequence,
    taskLabel: opts.taskLabel,
  })
  await startAgentEvent(event.id)

  try {
    const result = await fn()
    const extra = meta?.onComplete?.(result) ?? {}
    await completeAgentEvent(event.id, { status: 'completed', ...extra })
    return result
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    const extra = meta?.onError?.(error) ?? {}
    await completeAgentEvent(event.id, {
      status: 'failed',
      errorMessage: extra.errorMessage ?? error.message,
      errorAction: extra.errorAction ?? 'retry',
    })
    throw err
  }
}

/** Marks a step as skipped (e.g. image generation when asset is provided). */
export async function skipTracking(
  jobId: string,
  agent: string,
  sequence: number,
  taskLabel: string,
  reason: string
) {
  const event = await createAgentEvent({ jobId, agent, sequence, taskLabel })
  await startAgentEvent(event.id)
  await completeAgentEvent(event.id, { status: 'skipped', outputSummary: reason })
}

export type EventStatusType = EventStatus
