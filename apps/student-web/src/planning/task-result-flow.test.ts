import assert from 'node:assert/strict'
import test from 'node:test'
import type { DailyTask, StudySession } from './planning-client.ts'
import {
  continueLaterDisposition,
  finishStudySessionSafely,
  pendingResultEdits,
  saveTaskResult,
  type FinishSessionPorts,
  type TaskResultPorts,
} from './task-result-flow.ts'

const activeSession = (overrides: Partial<StudySession> = {}): StudySession => ({
  activeElapsedMs: 25 * 60 * 1000,
  cancelledAt: null,
  createdAt: '2026-10-13T08:00:00.000Z',
  dailyTaskId: 'task-1',
  durationMinutes: null,
  endedAt: null,
  focusRating: null,
  id: 'session-1',
  isTimerManaged: true,
  notes: null,
  pausedAt: null,
  serverNow: '2026-10-13T08:25:00.000Z',
  startedAt: '2026-10-13T08:00:00.000Z',
  studyQualityRating: null,
  subjectId: null,
  timerState: 'RUNNING',
  updatedAt: '2026-10-13T08:25:00.000Z',
  ...overrides,
})

const finishedSession = (overrides: Partial<StudySession> = {}): StudySession => activeSession({
  activeElapsedMs: 30 * 60 * 1000,
  durationMinutes: 30,
  endedAt: '2026-10-13T08:30:00.000Z',
  serverNow: '2026-10-13T08:30:00.000Z',
  timerState: 'FINISHED',
  updatedAt: '2026-10-13T08:30:00.000Z',
  ...overrides,
})

const task = (overrides: Partial<DailyTask> = {}): DailyTask => ({
  actualSolvedTestCount: 3,
  completedAt: null,
  contentType: 'STUDY',
  createdAt: '2026-10-13T07:00:00.000Z',
  curriculum: {
    completedItemCount: 0,
    remainingItemCount: 3,
    targets: [{
      createdAt: '2026-10-13T07:00:00.000Z',
      curriculumRefId: 'node-root',
      id: 'target-1',
      items: ['item-1', 'item-2', 'item-3'].map((id, position) => ({
        completedAt: null,
        createdAt: '2026-10-13T07:00:00.000Z',
        curriculumRefId: `node-${position + 1}`,
        id,
        labelSnapshot: `مبحث ${position + 1}`,
        pathSnapshot: ['زیست', `مبحث ${position + 1}`],
        position,
        referenceKind: 'NODE' as const,
        targetId: 'target-1',
      })),
      labelSnapshot: 'فصل اول',
      pathSnapshot: ['زیست', 'فصل اول'],
      position: 0,
      referenceKind: 'NODE',
      representationIdSnapshot: 'rep-1',
      selectionMode: 'SUBTREE',
    }],
    totalItemCount: 3,
  },
  description: null,
  endMinuteOfDay: null,
  estimatedMinutes: 45,
  id: 'task-1',
  plannedTestCount: 20,
  scheduledFor: '2026-10-13',
  skipReason: null,
  skippedAt: null,
  source: 'COUNSELOR',
  startMinuteOfDay: null,
  status: 'PENDING',
  subjectId: null,
  title: 'مرور زیست',
  topicId: null,
  updatedAt: 'version-1',
  ...overrides,
})

const withItemState = (
  current: DailyTask,
  itemId: string,
  completed: boolean,
  updatedAt: string,
): DailyTask => {
  const targets = current.curriculum.targets.map((target) => ({
    ...target,
    items: target.items.map((item) => item.id === itemId
      ? { ...item, completedAt: completed ? '2026-10-13T09:00:00.000Z' : null }
      : item),
  }))
  const items = targets.flatMap(({ items: targetItems }) => targetItems)
  const completedItemCount = items.filter(({ completedAt }) => completedAt !== null).length
  return {
    ...current,
    curriculum: {
      completedItemCount,
      remainingItemCount: items.length - completedItemCount,
      targets,
      totalItemCount: items.length,
    },
    updatedAt,
  }
}

test('lost finish response reconciles the same session as finished without repeating finish', async () => {
  let finishCalls = 0
  const session = activeSession()
  const ports: FinishSessionPorts = {
    finish: async () => {
      finishCalls += 1
      throw new TypeError('response lost')
    },
    loadActive: async () => null,
    loadTaskSessions: async () => [finishedSession()],
  }

  const report = await finishStudySessionSafely({ input: {}, session }, ports)

  assert.equal(report.kind, 'FINISHED')
  if (report.kind === 'FINISHED') {
    assert.equal(report.session.id, session.id)
    assert.equal(report.source, 'RECONCILIATION')
  }
  assert.equal(finishCalls, 1)
})

test('retry is enabled only after authoritative reconciliation still finds the same active session', async () => {
  const session = activeSession()
  const basePorts: FinishSessionPorts = {
    finish: async () => { throw new TypeError('response lost') },
    loadActive: async () => session,
    loadTaskSessions: async () => [session],
  }

  assert.equal(
    (await finishStudySessionSafely({ input: {}, session }, basePorts)).kind,
    'ACTIVE_RETRYABLE',
  )
  assert.equal(
    (await finishStudySessionSafely({ input: {}, session }, {
      ...basePorts,
      loadActive: async () => { throw new TypeError('offline') },
      loadTaskSessions: async () => { throw new TypeError('offline') },
    })).kind,
    'UNKNOWN',
  )
})

test('result save retains successful item writes and uses the latest task version for solved tests', async () => {
  const initial = task()
  let current = initial
  const itemCallOrder: string[] = []
  let solvedExpectedVersion = ''
  let completeCalls = 0
  const ports: TaskResultPorts = {
    completeTask: async () => {
      completeCalls += 1
      return { ...current, completedAt: '2026-10-13T09:10:00.000Z', status: 'COMPLETED' }
    },
    reconcileTask: async () => current,
    recordSolvedTests: async (_taskId, input) => {
      solvedExpectedVersion = input.expectedUpdatedAt
      current = { ...current, actualSolvedTestCount: input.actualSolvedTestCount, updatedAt: 'version-4' }
      return current
    },
    toggleCurriculumItem: async (_taskId, itemId, completed) => {
      itemCallOrder.push(itemId)
      if (itemId === 'item-2') throw new TypeError('item response lost')
      current = withItemState(current, itemId, completed, itemId === 'item-1' ? 'version-2' : 'version-3')
      return current
    },
  }

  const report = await saveTaskResult(initial, {
    curriculumChanges: [
      { completed: true, itemId: 'item-1' },
      { completed: true, itemId: 'item-2' },
      { completed: true, itemId: 'item-3' },
    ],
    outcome: 'COMPLETE',
    solvedTestCount: '12',
  }, ports)

  assert.deepEqual(itemCallOrder, ['item-1', 'item-2', 'item-3'])
  assert.equal(solvedExpectedVersion, 'version-3')
  assert.deepEqual(report.curriculum.failedItemIds, ['item-2'])
  assert.deepEqual(report.curriculum.savedItemIds, ['item-1', 'item-3'])
  assert.equal(report.solvedTests.kind, 'SAVED')
  assert.equal(report.outcome.kind, 'BLOCKED')
  assert.equal(report.task.updatedAt, 'version-4')
  assert.equal(completeCalls, 0)
})

test('lost completion response reconciles completed state without repeating completion', async () => {
  const fullyCovered = withItemState(
    withItemState(withItemState(task(), 'item-1', true, 'version-2'), 'item-2', true, 'version-3'),
    'item-3',
    true,
    'version-4',
  )
  let completeCalls = 0
  const completed = {
    ...fullyCovered,
    completedAt: '2026-10-13T09:20:00.000Z',
    status: 'COMPLETED' as const,
    updatedAt: 'version-5',
  }

  const report = await saveTaskResult(fullyCovered, {
    curriculumChanges: [],
    outcome: 'COMPLETE',
    solvedTestCount: String(fullyCovered.actualSolvedTestCount),
  }, {
    completeTask: async () => {
      completeCalls += 1
      throw new TypeError('completion response lost')
    },
    reconcileTask: async () => completed,
    recordSolvedTests: async () => { throw new Error('not expected') },
    toggleCurriculumItem: async () => { throw new Error('not expected') },
  })

  assert.equal(report.outcome.kind, 'COMPLETED')
  assert.equal(report.task.status, 'COMPLETED')
  assert.equal(completeCalls, 1)
})

test('unknown completion outcome blocks retry until authoritative task state is available', async () => {
  const fullyCovered = withItemState(
    withItemState(withItemState(task(), 'item-1', true, 'version-2'), 'item-2', true, 'version-3'),
    'item-3',
    true,
    'version-4',
  )
  let completeCalls = 0
  const report = await saveTaskResult(fullyCovered, {
    curriculumChanges: [],
    outcome: 'COMPLETE',
    solvedTestCount: String(fullyCovered.actualSolvedTestCount),
  }, {
    completeTask: async () => {
      completeCalls += 1
      throw new TypeError('completion response lost')
    },
    reconcileTask: async () => null,
    recordSolvedTests: async () => { throw new Error('not expected') },
    toggleCurriculumItem: async () => { throw new Error('not expected') },
  })

  assert.equal(report.outcome.kind, 'UNKNOWN')
  assert.deepEqual(report.unsaved, ['TASK_OUTCOME'])
  assert.equal(completeCalls, 1)
})

test('stale solved-test save preserves the local draft after authoritative reconciliation', async () => {
  const initial = task()
  const authoritative = { ...initial, actualSolvedTestCount: 7, updatedAt: 'version-2' }
  let submittedVersion = ''

  const report = await saveTaskResult(initial, {
    curriculumChanges: [],
    outcome: 'CONTINUE',
    solvedTestCount: '14',
  }, {
    completeTask: async () => { throw new Error('not expected') },
    reconcileTask: async () => authoritative,
    recordSolvedTests: async (_taskId, input) => {
      submittedVersion = input.expectedUpdatedAt
      throw new Error('TASK_PROGRESS_STALE')
    },
    toggleCurriculumItem: async () => { throw new Error('not expected') },
  })

  assert.equal(submittedVersion, initial.updatedAt)
  assert.equal(report.task.updatedAt, authoritative.updatedAt)
  assert.equal(report.solvedTests.kind, 'FAILED')
  assert.equal(report.solvedTests.draft, '14')
  assert.deepEqual(report.unsaved, ['SOLVED_TESTS'])
})

test('continue later names unsaved edits and requires confirmation before discard', () => {
  const initial = task()
  const dirtyDraft = {
    curriculumChanges: [{ completed: true, itemId: 'item-1' }],
    outcome: 'CONTINUE' as const,
    solvedTestCount: '12',
  }
  assert.deepEqual(pendingResultEdits(initial, dirtyDraft), ['CURRICULUM', 'SOLVED_TESTS'])
  assert.equal(continueLaterDisposition({ saved: ['CURRICULUM'], unsaved: ['SOLVED_TESTS'] }), 'CONFIRM_DISCARD')
  assert.equal(continueLaterDisposition({ saved: ['CURRICULUM', 'SOLVED_TESTS'], unsaved: [] }), 'CLOSE')
})
