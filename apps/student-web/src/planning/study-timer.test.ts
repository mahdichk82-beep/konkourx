import assert from 'node:assert/strict'
import test from 'node:test'
import type { StudySession } from './planning-client.ts'
import * as timerModule from './study-timer.ts'

const timer = timerModule as typeof timerModule & {
  createStudyTimerAnchor(session: StudySession, monotonicNowMs: number): {
    activeElapsedMs: number
    monotonicNowMs: number
    serverNowMs: number
    timerState: StudySession['timerState']
  }
  projectStudyTimerElapsedMs(
    anchor: ReturnType<typeof timer.createStudyTimerAnchor>,
    monotonicNowMs: number,
  ): number
  StudyTimerOperationGate: new () => {
    begin(): number | null
    finish(token: number): void
    invalidate(): void
    accepts(token: number): boolean
  }
  executeTimerTransition(
    session: StudySession,
    request: (id: string, input: { expectedUpdatedAt: string }) => Promise<StudySession>,
  ): Promise<StudySession>
  executeWithTimerReconciliation<T>(
    request: () => Promise<T>,
    reconcile: () => Promise<void>,
  ): Promise<T>
  additionalSessionLabel(sessions: StudySession[]): string
  finalStudySessionElapsedMs(session: StudySession): number | null
  selectNewerStudySession(current: StudySession, incoming: StudySession): StudySession
  shouldReconcileStudyTimer(
    event: 'focus' | 'online' | 'visibilitychange' | 'broadcast',
    visibilityState?: DocumentVisibilityState,
  ): boolean
}

const studySession = (
  timerState: StudySession['timerState'],
  overrides: Partial<StudySession> = {},
): StudySession => ({
  activeElapsedMs: 900_000,
  cancelledAt: null,
  createdAt: '2026-10-09T08:00:00.000Z',
  dailyTaskId: 'task-a',
  durationMinutes: null,
  endedAt: null,
  focusRating: null,
  id: 'session-a',
  isTimerManaged: true,
  notes: null,
  pausedAt: null,
  serverNow: '2026-10-09T08:15:00.000Z',
  startedAt: '2026-10-09T08:00:00.000Z',
  studyQualityRating: null,
  subjectId: null,
  timerState,
  updatedAt: '2026-10-09T08:15:00.000Z',
  ...overrides,
})

test('running projection advances server elapsed time only by monotonic client time', () => {
  assert.equal(typeof timer.createStudyTimerAnchor, 'function')
  const anchor = timer.createStudyTimerAnchor(studySession('RUNNING'), 5_000)

  assert.deepEqual(anchor, {
    activeElapsedMs: 900_000,
    monotonicNowMs: 5_000,
    serverNowMs: Date.parse('2026-10-09T08:15:00.000Z'),
    timerState: 'RUNNING',
  })
  assert.equal(timer.projectStudyTimerElapsedMs(anchor, 17_345), 912_345)
})

test('paused and terminal projections remain frozen at the server-confirmed duration', () => {
  assert.equal(typeof timer.createStudyTimerAnchor, 'function')
  for (const timerState of ['PAUSED', 'FINISHED', 'CANCELLED'] as const) {
    const anchor = timer.createStudyTimerAnchor(studySession(timerState), 10_000)
    assert.equal(timer.projectStudyTimerElapsedMs(anchor, 70_000), 900_000)
  }
})

test('timer operation gate blocks duplicate clicks and rejects stale responses', () => {
  assert.equal(typeof timer.StudyTimerOperationGate, 'function')
  const gate = new timer.StudyTimerOperationGate()
  const first = gate.begin()
  assert.equal(typeof first, 'number')
  assert.equal(gate.begin(), null)
  assert.equal(gate.accepts(first!), true)

  gate.invalidate()
  assert.equal(gate.accepts(first!), false)
  const second = gate.begin()
  assert.equal(typeof second, 'number')
  gate.finish(second!)
  assert.equal(gate.begin() !== null, true)
})

test('pause and resume transitions send the authoritative expectedUpdatedAt guard', async () => {
  assert.equal(typeof timer.executeTimerTransition, 'function')
  const session = studySession('RUNNING')
  const requests: Array<[string, { expectedUpdatedAt: string }]> = []

  const result = await timer.executeTimerTransition(session, async (id, input) => {
    requests.push([id, input])
    return studySession('PAUSED', {
      pausedAt: '2026-10-09T08:15:01.000Z',
      updatedAt: '2026-10-09T08:15:01.000Z',
    })
  })

  assert.deepEqual(requests, [[session.id, { expectedUpdatedAt: session.updatedAt }]])
  assert.equal(result.timerState, 'PAUSED')
})

test('a pending task with finished history requires an explicit additional-session action', () => {
  assert.equal(typeof timer.additionalSessionLabel, 'function')
  const finished = studySession('FINISHED', {
    activeElapsedMs: 1_500_000,
    durationMinutes: 25,
    endedAt: '2026-10-09T08:25:00.000Z',
    updatedAt: '2026-10-09T08:25:00.000Z',
  })

  assert.equal(timer.additionalSessionLabel([]), 'شروع مطالعه')
  assert.equal(timer.additionalSessionLabel([finished]), 'افزودن جلسه مطالعه دیگر')
  assert.equal(timer.additionalSessionLabel([studySession('CANCELLED', {
    cancelledAt: '2026-10-09T08:05:00.000Z',
  })]), 'شروع مطالعه')
})

test('an older response cannot overwrite a newer authoritative session snapshot', () => {
  assert.equal(typeof timer.selectNewerStudySession, 'function')
  const current = studySession('PAUSED', {
    pausedAt: '2026-10-09T08:20:00.000Z',
    updatedAt: '2026-10-09T08:20:00.000Z',
  })
  const stale = studySession('RUNNING', {
    updatedAt: '2026-10-09T08:15:00.000Z',
  })
  const resumed = studySession('RUNNING', {
    activeElapsedMs: 1_200_000,
    updatedAt: '2026-10-09T08:25:00.000Z',
  })

  assert.equal(timer.selectNewerStudySession(current, stale), current)
  assert.equal(timer.selectNewerStudySession(current, resumed), resumed)
})

test('reconciliation events ignore hidden visibility changes but accept recovery signals', () => {
  assert.equal(typeof timer.shouldReconcileStudyTimer, 'function')
  assert.equal(timer.shouldReconcileStudyTimer('visibilitychange', 'hidden'), false)
  assert.equal(timer.shouldReconcileStudyTimer('visibilitychange', 'visible'), true)
  assert.equal(timer.shouldReconcileStudyTimer('focus'), true)
  assert.equal(timer.shouldReconcileStudyTimer('online'), true)
  assert.equal(timer.shouldReconcileStudyTimer('broadcast'), true)
})

test('finish while paused displays the immutable server-recorded active duration', () => {
  assert.equal(typeof timer.finalStudySessionElapsedMs, 'function')
  const finishedWhilePaused = studySession('FINISHED', {
    activeElapsedMs: 1_234_567,
    durationMinutes: 21,
    endedAt: '2026-10-09T08:30:00.000Z',
    pausedAt: null,
    updatedAt: '2026-10-09T08:30:00.000Z',
  })

  assert.equal(timer.finalStudySessionElapsedMs(finishedWhilePaused), 1_234_567)
  assert.equal(timer.finalStudySessionElapsedMs(studySession('RUNNING')), null)
})

test('a failed operation preserves its error after authoritative reconciliation', async () => {
  assert.equal(typeof timer.executeWithTimerReconciliation, 'function')
  const originalError = new Error('network failed')
  let reconciliations = 0

  await assert.rejects(
    timer.executeWithTimerReconciliation(
      async () => { throw originalError },
      async () => { reconciliations += 1 },
    ),
    (error) => error === originalError,
  )
  assert.equal(reconciliations, 1)
})
