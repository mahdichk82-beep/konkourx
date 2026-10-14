import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildCompactTaskSummary,
  calendarDateKey,
  classifyTaskPresentation,
  formatCurriculumProgress,
  millisecondsUntilNextTehranDay,
  subscribeToTehranDay,
  summarizeTaskPresentations,
  tehranDateKey,
} from './index.ts'

test('calendar date keys preserve the scheduled calendar day without timezone conversion', () => {
  assert.equal(calendarDateKey('2026-10-12'), '2026-10-12')
  assert.equal(calendarDateKey('2026-10-12T00:00:00.000Z'), '2026-10-12')
  assert.equal(calendarDateKey('2026-10-12T23:45:00.000-07:00'), '2026-10-12')
  assert.equal(calendarDateKey('2026-02-29'), null)
  assert.equal(calendarDateKey('2026-10-12T00:00:00'), null)
  assert.equal(calendarDateKey('2026-10-12T99:99:99Z'), null)
  assert.equal(calendarDateKey('2026-10-12T23:59:59+99:99'), null)
  assert.equal(calendarDateKey('2026-10-12 trailing-data'), null)
})

test('compact weekly summaries keep lifecycle, planned workload, and measured progress', () => {
  const summary = buildCompactTaskSummary({
    actualSolvedTestCount: 7,
    completedAt: '2026-10-13T08:00:00.000Z',
    curriculum: { completedItemCount: 2, totalItemCount: 5 },
    endMinuteOfDay: null,
    estimatedMinutes: 45,
    plannedTestCount: 20,
    scheduledFor: '2026-10-12T00:00:00.000Z',
    startMinuteOfDay: null,
    status: 'COMPLETED',
    title: 'مرور بسیار طولانی فصل تنظیم عصبی',
  }, '2026-10-14')

  assert.equal(summary.presentation.status, 'COMPLETED_LATE')
  assert.equal(summary.presentation.label, 'انجام‌شده با تأخیر')
  assert.equal(summary.plannedLabel, '۴۵ دقیقه')
  assert.deepEqual(summary.progress, {
    label: '۲ از ۵ مبحث',
    value: 40,
  })

  const testsOnly = buildCompactTaskSummary({
    actualSolvedTestCount: 9,
    completedAt: null,
    curriculum: { completedItemCount: 0, totalItemCount: 0 },
    endMinuteOfDay: 615,
    estimatedMinutes: null,
    plannedTestCount: 12,
    scheduledFor: '2026-10-12',
    startMinuteOfDay: 555,
    status: 'PARTIAL',
    title: 'آزمون',
  }, '2026-10-14')

  assert.equal(testsOnly.presentation.status, 'PARTIAL')
  assert.equal(testsOnly.presentation.indicatorLabel, 'از موعد گذشته')
  assert.equal(testsOnly.plannedLabel, '۶۰ دقیقه')
  assert.deepEqual(testsOnly.progress, {
    label: '۹ از ۱۲ تست',
    value: 75,
  })

  const rescheduledWithHistory = buildCompactTaskSummary({
    actualSolvedTestCount: 9,
    completedAt: null,
    curriculum: { completedItemCount: 0, totalItemCount: 0 },
    deadlineMisses: [{
      deadlineAt: '2026-10-12T20:30:00.000Z',
      recordedAt: '2026-10-12T20:35:00.000Z',
      scheduledFor: '2026-10-12',
    }],
    endMinuteOfDay: 615,
    estimatedMinutes: null,
    plannedTestCount: 12,
    scheduledFor: '2026-10-20',
    startMinuteOfDay: 555,
    status: 'PENDING',
    title: 'آزمون',
  }, '2026-10-14')
  assert.equal(rescheduledWithHistory.presentation.indicatorLabel, 'دارای سابقه انجام‌نشده')
})

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

test('durable missed days remain separate and visible after a pending task is rescheduled', () => {
  const presentation = classifyTaskPresentation({
    completedAt: null,
    deadlineMisses: [{
      deadlineAt: '2026-10-01T20:30:00.000Z',
      recordedAt: '2026-10-01T20:35:00.000Z',
      scheduledFor: '2026-10-01',
    }],
    scheduledFor: '2026-10-12',
    status: 'PENDING',
  }, '2026-10-09')

  assert.equal(presentation.status, 'PENDING')
  assert.equal(presentation.isOverdue, false)
  assert.equal(presentation.missedDeadlineCount, 1)
  assert.equal(presentation.indicatorLabel, 'دارای سابقه انجام‌نشده')
})

test('historical partial keeps its lifecycle meaning alongside durable missed evidence', () => {
  const presentation = classifyTaskPresentation({
    completedAt: null,
    deadlineMisses: [{
      deadlineAt: '2026-10-01T20:30:00.000Z',
      recordedAt: '2026-10-01T20:35:00.000Z',
      scheduledFor: '2026-10-01',
    }],
    scheduledFor: '2026-10-01',
    status: 'PARTIAL',
  }, '2026-10-09')

  assert.equal(presentation.status, 'PARTIAL')
  assert.equal(presentation.missedDeadlineCount, 1)
  assert.equal(presentation.indicatorLabel, 'دارای سابقه انجام‌نشده')
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
