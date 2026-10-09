import { useContext, useEffect, useState } from 'react'
import type { StudySession } from './planning-client'
import { StudyTimerContext, type StudyTimerContextValue } from './study-timer-context'
import {
  createStudyTimerAnchor,
  projectStudyTimerElapsedMs,
  type StudyTimerAnchor,
} from './study-timer'

export function useStudyTimer(): StudyTimerContextValue {
  const context = useContext(StudyTimerContext)
  if (!context) throw new Error('useStudyTimer must be used within StudyTimerProvider')
  return context
}

export function useStudyTimerElapsed(session: StudySession): number {
  const sessionKey = `${session.id}:${session.updatedAt}:${session.serverNow}:${session.timerState}`
  const [clock, setClock] = useState<{
    anchor: StudyTimerAnchor
    monotonicNowMs: number
    sessionKey: string
  } | null>(null)

  useEffect(() => {
    const anchor = createStudyTimerAnchor(session, performance.now())
    const update = () => setClock({
      anchor,
      monotonicNowMs: performance.now(),
      sessionKey,
    })
    const frame = window.requestAnimationFrame(update)
    if (session.timerState !== 'RUNNING') {
      return () => window.cancelAnimationFrame(frame)
    }
    const interval = window.setInterval(update, 1_000)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearInterval(interval)
    }
  }, [session, sessionKey])

  if (!clock || clock.sessionKey !== sessionKey) return session.activeElapsedMs
  return projectStudyTimerElapsedMs(clock.anchor, clock.monotonicNowMs)
}
