import type { StudySession } from './planning-client'

export type StudyTimerAnchor = {
  activeElapsedMs: number
  monotonicNowMs: number
  serverNowMs: number
  timerState: StudySession['timerState']
}

export const createStudyTimerAnchor = (
  session: StudySession,
  monotonicNowMs: number,
): StudyTimerAnchor => ({
  activeElapsedMs: Math.max(0, session.activeElapsedMs),
  monotonicNowMs,
  serverNowMs: Date.parse(session.serverNow),
  timerState: session.timerState,
})

export const projectStudyTimerElapsedMs = (
  anchor: StudyTimerAnchor,
  monotonicNowMs: number,
): number => anchor.timerState === 'RUNNING'
  ? anchor.activeElapsedMs + Math.max(0, monotonicNowMs - anchor.monotonicNowMs)
  : anchor.activeElapsedMs

export class StudyTimerOperationGate {
  private busy = false
  private generation = 0

  begin(): number | null {
    if (this.busy) return null
    this.busy = true
    this.generation += 1
    return this.generation
  }

  accepts(token: number): boolean {
    return this.busy && token === this.generation
  }

  finish(token: number): void {
    if (this.accepts(token)) this.busy = false
  }

  invalidate(): void {
    this.generation += 1
    this.busy = false
  }
}

export const executeTimerTransition = (
  session: StudySession,
  request: (
    id: string,
    input: { expectedUpdatedAt: string },
  ) => Promise<StudySession>,
): Promise<StudySession> => request(session.id, { expectedUpdatedAt: session.updatedAt })

export const executeWithTimerReconciliation = async <T,>(
  request: () => Promise<T>,
  reconcile: () => Promise<void>,
): Promise<T> => {
  try {
    return await request()
  } catch (error) {
    try {
      await reconcile()
    } catch {
      // Preserve the operation error; a later focus/online event will retry recovery.
    }
    throw error
  }
}

export const additionalSessionLabel = (sessions: StudySession[]): string => (
  sessions.some((session) => session.cancelledAt === null && session.endedAt !== null)
    ? 'افزودن جلسه مطالعه دیگر'
    : 'شروع مطالعه'
)

export const selectNewerStudySession = (
  current: StudySession,
  incoming: StudySession,
): StudySession => {
  if (current.id !== incoming.id) return incoming
  const currentUpdatedAt = Date.parse(current.updatedAt)
  const incomingUpdatedAt = Date.parse(incoming.updatedAt)
  if (!Number.isFinite(incomingUpdatedAt)) return current
  if (!Number.isFinite(currentUpdatedAt)) return incoming
  return incomingUpdatedAt >= currentUpdatedAt ? incoming : current
}

export const shouldReconcileStudyTimer = (
  event: 'focus' | 'online' | 'visibilitychange' | 'broadcast',
  visibilityState?: DocumentVisibilityState,
): boolean => event !== 'visibilitychange' || visibilityState === 'visible'

export const finalStudySessionElapsedMs = (session: StudySession): number | null => (
  session.timerState === 'FINISHED' && session.endedAt !== null
    ? Math.max(0, session.activeElapsedMs)
    : null
)
