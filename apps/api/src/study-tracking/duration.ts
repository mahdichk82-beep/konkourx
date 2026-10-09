import type { StudySessionRecord, StudySessionTimerState } from './types.js'

type StudySessionTiming = Pick<
  StudySessionRecord,
  'cancelledAt' | 'endedAt' | 'startedAt'
> & {
  pauses?: Array<Pick<NonNullable<StudySessionRecord['pauses']>[number], 'pausedAt' | 'resumedAt'>>
}

export const deriveStudySessionTimerState = (
  session: Pick<StudySessionRecord, 'cancelledAt' | 'endedAt' | 'pauses'>,
): StudySessionTimerState => {
  if (session.cancelledAt) return 'CANCELLED'
  if (session.endedAt) return 'FINISHED'
  if (session.pauses?.some((pause) => pause.resumedAt === null)) return 'PAUSED'
  return 'RUNNING'
}

export const calculateStudySessionActiveElapsedMs = (
  session: StudySessionTiming,
  serverNow: Date,
): number => {
  const boundary = session.endedAt ?? session.cancelledAt ?? serverNow
  const startedAtMs = session.startedAt.getTime()
  const boundaryMs = Math.max(boundary.getTime(), startedAtMs)
  const pausedMs = (session.pauses ?? []).reduce((total, pause) => {
    const pauseStartMs = Math.min(Math.max(pause.pausedAt.getTime(), startedAtMs), boundaryMs)
    const pauseEndMs = Math.min(
      Math.max((pause.resumedAt ?? boundary).getTime(), pauseStartMs),
      boundaryMs,
    )
    return total + pauseEndMs - pauseStartMs
  }, 0)
  return Math.max(0, boundaryMs - startedAtMs - pausedMs)
}

export const calculateStudySessionDurationMinutes = (
  startedAt: Date,
  endedAt: Date,
): number => Math.round((endedAt.getTime() - startedAt.getTime()) / 60_000)
