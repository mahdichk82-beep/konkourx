import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateStudySessionActiveElapsedMs,
  deriveStudySessionTimerState,
} from '../src/study-tracking/duration.js'
import type { StudySessionRecord } from '../src/study-tracking/types.js'

const at = (value: string): Date => new Date(`2026-10-09T${value}:00.000Z`)

const session = (overrides: Partial<StudySessionRecord> = {}): StudySessionRecord => ({
  cancelledAt: null,
  createdAt: at('08:00'),
  dailyTaskId: 'task-1',
  endedAt: null,
  focusRating: null,
  id: 'session-1',
  isTimerManaged: true,
  notes: null,
  pauses: [],
  startedAt: at('08:00'),
  studentProfileId: 'profile-1',
  studyQualityRating: null,
  subjectId: 'subject-1',
  updatedAt: at('08:00'),
  ...overrides,
})

test('active elapsed time excludes every completed pause interval', () => {
  const value = session({
    endedAt: at('10:00'),
    pauses: [
      { id: 'pause-1', pausedAt: at('08:15'), resumedAt: at('08:30'), studySessionId: 'session-1' },
      { id: 'pause-2', pausedAt: at('09:00'), resumedAt: at('09:20'), studySessionId: 'session-1' },
    ],
  })

  assert.equal(calculateStudySessionActiveElapsedMs(value, at('12:00')), 5_100_000)
  assert.equal(deriveStudySessionTimerState(value), 'FINISHED')
})

test('a session finished while paused excludes the open pause without fabricating resume', () => {
  const value = session({
    endedAt: at('09:30'),
    pauses: [
      { id: 'pause-1', pausedAt: at('08:45'), resumedAt: null, studySessionId: 'session-1' },
    ],
  })

  assert.equal(calculateStudySessionActiveElapsedMs(value, at('12:00')), 2_700_000)
  assert.equal(value.pauses?.[0]?.resumedAt, null)
  assert.equal(deriveStudySessionTimerState(value), 'FINISHED')
})

test('paused and cancelled sessions stop accumulating at their authoritative boundary', () => {
  const paused = session({
    pauses: [
      { id: 'pause-1', pausedAt: at('08:20'), resumedAt: null, studySessionId: 'session-1' },
    ],
  })
  const cancelled = session({
    cancelledAt: at('08:50'),
    pauses: [
      { id: 'pause-1', pausedAt: at('08:20'), resumedAt: at('08:30'), studySessionId: 'session-1' },
    ],
  })

  assert.equal(calculateStudySessionActiveElapsedMs(paused, at('11:00')), 1_200_000)
  assert.equal(deriveStudySessionTimerState(paused), 'PAUSED')
  assert.equal(calculateStudySessionActiveElapsedMs(cancelled, at('11:00')), 2_400_000)
  assert.equal(deriveStudySessionTimerState(cancelled), 'CANCELLED')
})
