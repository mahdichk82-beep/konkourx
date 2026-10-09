import assert from 'node:assert/strict'
import test from 'node:test'
import {
  classifyTaskPresentation,
  formatCurriculumProgress,
  millisecondsUntilNextTehranDay,
  subscribeToTehranDay,
  summarizeTaskPresentations,
  tehranDateKey,
} from './index.ts'

test('curriculum progress remains visible independently of missed classification', () => {
  assert.equal(formatCurriculumProgress(4, 10), '۴ از ۱۰ مبحث تکمیل شده')
})

test('day subscription refreshes on focus, visible restoration, and the next boundary without polling', () => {
  let now = new Date('2026-10-08T20:29:00.000Z')
  let focusListener = () => {}
  let visibilityListener = () => {}
  let timerListener = () => {}
  let timerDelay = 0
  let clearedTimers = 0
  let visible = true
  const observed: string[] = []

  const unsubscribe = subscribeToTehranDay((key) => observed.push(key), {
    addFocusListener(listener) {
      focusListener = listener
      return () => { focusListener = () => {} }
    },
    addVisibilityListener(listener) {
      visibilityListener = listener
      return () => { visibilityListener = () => {} }
    },
    clearTimer() {
      clearedTimers += 1
    },
    isVisible: () => visible,
    now: () => now,
    setTimer(listener, delay) {
      timerListener = listener
      timerDelay = delay
      return 1
    },
  })

  assert.deepEqual(observed, ['2026-10-08'])
  assert.equal(timerDelay, 60_001)

  now = new Date('2026-10-08T20:30:00.000Z')
  focusListener()
  assert.deepEqual(observed, ['2026-10-08', '2026-10-09'])

  visible = false
  now = new Date('2026-10-09T20:30:00.000Z')
  visibilityListener()
  assert.equal(observed.at(-1), '2026-10-09')

  visible = true
  visibilityListener()
  assert.equal(observed.at(-1), '2026-10-10')

  now = new Date('2026-10-10T20:30:00.000Z')
  timerListener()
  assert.equal(observed.at(-1), '2026-10-11')

  unsubscribe()
  assert.ok(clearedTimers >= 4)
})

test('Tehran date changes exactly at Tehran midnight', () => {
  assert.equal(tehranDateKey(new Date('2026-10-08T20:29:59.999Z')), '2026-10-08')
  assert.equal(tehranDateKey(new Date('2026-10-08T20:30:00.000Z')), '2026-10-09')
  assert.equal(millisecondsUntilNextTehranDay(new Date('2026-10-08T20:29:59.999Z')), 1)
})

test('past pending task is missed regardless of curriculum progress or fixed hours', () => {
  const presentation = classifyTaskPresentation({
    completedAt: null,
    scheduledFor: '2026-10-08',
    status: 'PENDING',
    completedItemCount: 4,
    endMinuteOfDay: 720,
    startMinuteOfDay: 660,
  }, '2026-10-09')

  assert.deepEqual(presentation, {
    isOverdue: true,
    label: 'انجام‌نشده',
    status: 'MISSED',
  })
})

test('pending task scheduled today stays pending', () => {
  assert.deepEqual(classifyTaskPresentation({
    completedAt: null,
    scheduledFor: '2026-10-09T00:00:00.000Z',
    status: 'PENDING',
  }, '2026-10-09'), {
    isOverdue: false,
    label: 'در انتظار انجام',
    status: 'PENDING',
  })
})

test('completion becomes late only on a later Tehran calendar date', () => {
  assert.equal(classifyTaskPresentation({
    completedAt: '2026-10-08T20:29:59.999Z',
    scheduledFor: '2026-10-08',
    status: 'COMPLETED',
  }, '2026-10-09').status, 'COMPLETED')

  assert.deepEqual(classifyTaskPresentation({
    completedAt: '2026-10-08T20:30:00.000Z',
    scheduledFor: '2026-10-08',
    status: 'COMPLETED',
  }, '2026-10-09'), {
    isOverdue: false,
    label: 'انجام‌شده با تأخیر',
    status: 'COMPLETED_LATE',
  })
})

test('skipped remains distinct from missed', () => {
  assert.deepEqual(classifyTaskPresentation({
    completedAt: null,
    scheduledFor: '2026-10-01',
    status: 'SKIPPED',
  }, '2026-10-09'), {
    isOverdue: false,
    label: 'ردشده',
    status: 'SKIPPED',
  })
})

test('historical partial status is preserved with a separate overdue indicator', () => {
  assert.deepEqual(classifyTaskPresentation({
    completedAt: null,
    scheduledFor: '2026-10-01',
    status: 'PARTIAL',
  }, '2026-10-09'), {
    indicatorLabel: 'از موعد گذشته',
    isOverdue: true,
    label: 'بخشی انجام‌شده',
    status: 'PARTIAL',
  })
})

test('authoritative rescheduling changes the derived classification', () => {
  const task = { completedAt: null, scheduledFor: '2026-10-08', status: 'PENDING' as const }
  assert.equal(classifyTaskPresentation(task, '2026-10-09').status, 'MISSED')
  assert.equal(classifyTaskPresentation({ ...task, scheduledFor: '2026-10-10' }, '2026-10-09').status, 'PENDING')
})

test('invalid schedule or completion values fail safely to lifecycle presentation', () => {
  assert.equal(classifyTaskPresentation({
    completedAt: null,
    scheduledFor: 'not-a-date',
    status: 'PENDING',
  }, '2026-10-09').status, 'PENDING')
  assert.equal(classifyTaskPresentation({
    completedAt: 'not-a-date',
    scheduledFor: '2026-10-01',
    status: 'COMPLETED',
  }, '2026-10-09').status, 'COMPLETED')
})

test('presentation summaries do not count missed as pending or late as on-time completed', () => {
  const tasks = [
    { completedAt: null, scheduledFor: '2026-10-08', status: 'PENDING' as const },
    { completedAt: null, scheduledFor: '2026-10-09', status: 'PENDING' as const },
    { completedAt: '2026-10-09T08:00:00Z', scheduledFor: '2026-10-08', status: 'COMPLETED' as const },
    { completedAt: '2026-10-08T08:00:00Z', scheduledFor: '2026-10-08', status: 'COMPLETED' as const },
    { completedAt: null, scheduledFor: '2026-10-08', status: 'SKIPPED' as const },
    { completedAt: null, scheduledFor: '2026-10-08', status: 'PARTIAL' as const },
  ]

  assert.deepEqual(summarizeTaskPresentations(tasks, '2026-10-09'), {
    COMPLETED: 1,
    COMPLETED_LATE: 1,
    MISSED: 1,
    PARTIAL: 1,
    PENDING: 1,
    SKIPPED: 1,
  })
})
