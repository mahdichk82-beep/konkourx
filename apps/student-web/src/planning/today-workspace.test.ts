import assert from 'node:assert/strict'
import test from 'node:test'
import type { DailyTask, StudySession } from './planning-client.ts'
import * as todayWorkspace from './today-workspace.ts'
import {
  activeTaskMatch,
  detailNavigationReducer,
  initialDetailNavigationState,
  taskActionModel,
  taskSummaryModel,
  todayTaskGroups,
} from './today-workspace.ts'

const task = (overrides: Partial<DailyTask> = {}): DailyTask => ({
  actualSolvedTestCount: 0,
  completedAt: null,
  contentType: 'STUDY',
  createdAt: '2026-10-13T07:00:00.000Z',
  curriculum: {
    completedItemCount: 0,
    remainingItemCount: 1,
    targets: [{
      createdAt: '2026-10-13T07:00:00.000Z',
      curriculumRefId: 'node-1',
      id: 'target-1',
      items: [],
      labelSnapshot: 'فصل اول',
      pathSnapshot: ['زیست', 'فصل اول'],
      position: 0,
      referenceKind: 'NODE',
      representationIdSnapshot: 'rep-1',
      selectionMode: 'SUBTREE',
    }],
    totalItemCount: 1,
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

const activeSession = (dailyTaskId: string): StudySession => ({
  activeElapsedMs: 0,
  cancelledAt: null,
  createdAt: '2026-10-13T08:00:00.000Z',
  dailyTaskId,
  durationMinutes: null,
  endedAt: null,
  focusRating: null,
  id: 'session-1',
  isTimerManaged: true,
  notes: null,
  pausedAt: null,
  serverNow: '2026-10-13T08:00:00.000Z',
  startedAt: '2026-10-13T08:00:00.000Z',
  studyQualityRating: null,
  subjectId: null,
  timerState: 'RUNNING',
  updatedAt: 'version-1',
})

test('one primary action respects content type, lifecycle, and active association', () => {
  const pendingStudy = task()
  assert.deepEqual(taskActionModel(pendingStudy, null), {
    primary: 'START_STUDY',
    secondary: ['RECORD_RESULT'],
  })
  assert.equal(taskActionModel(pendingStudy, activeSession('task-1')).primary, 'FINISH_AND_RECORD')
  assert.equal(taskActionModel(pendingStudy, activeSession('task-2')).primary, 'SWITCH_STUDY')
  assert.equal(taskActionModel(task({ contentType: 'GENERAL' }), null).primary, 'RECORD_RESULT')
  assert.equal(taskActionModel(task({ status: 'PARTIAL' }), null).primary, 'VIEW_DETAILS')
  assert.equal(taskActionModel(task({ contentType: null }), null).primary, 'VIEW_DETAILS')
})

test('today precedes overdue and every terminal today status remains present', () => {
  const today = [
    task(),
    task({ id: 'completed', status: 'COMPLETED' }),
    task({ id: 'partial', status: 'PARTIAL' }),
    task({ id: 'skipped', status: 'SKIPPED' }),
  ]
  const groups = todayTaskGroups(today, [task({ id: 'overdue', scheduledFor: '2026-10-12' })])
  assert.deepEqual(groups.map(({ id }) => id), ['today', 'overdue'])
  assert.deepEqual(groups[0]?.items.map(({ status }) => status), [
    'PENDING',
    'COMPLETED',
    'PARTIAL',
    'SKIPPED',
  ])
})

test('summaries distinguish exact time from date-only truth and keep numeric zero', () => {
  const dateOnly = taskSummaryModel(task(), null)
  assert.equal(dateOnly.schedule.kind, 'DATE_ONLY')
  assert.doesNotMatch(dateOnly.schedule.label, /\d{1,2}:\d{2}/)
  assert.equal(dateOnly.context, 'زیست / فصل اول')
  assert.equal(dateOnly.actualSolvedTestCount, 0)

  const timed = taskSummaryModel(task({ startMinuteOfDay: 480, endMinuteOfDay: 540 }), 'زیست‌شناسی')
  assert.equal(timed.schedule.kind, 'TIMED')
  assert.match(timed.schedule.label, /۸:۰۰.*۹:۰۰/)
  assert.equal(timed.context, 'زیست‌شناسی')
})

test('active session matches only its dailyTaskId and requests an exact load when absent', () => {
  const active = activeSession('task-2')
  assert.equal(activeTaskMatch(active, [task()]), null)
  assert.equal(activeTaskMatch(active, [task({ id: 'task-2' })])?.id, active.dailyTaskId)
  assert.equal(activeTaskMatch(activeSession('task-1'), [task({ id: 'task-1' })])?.id, 'task-1')
})

test('mobile detail close restores the originating task identity', () => {
  const opened = detailNavigationReducer(initialDetailNavigationState, {
    taskId: 'task-2',
    type: 'OPEN',
  })
  assert.deepEqual(opened, { returnFocusTaskId: null, selectedTaskId: 'task-2' })
  assert.deepEqual(detailNavigationReducer(opened, { type: 'CLOSE' }), {
    returnFocusTaskId: 'task-2',
    selectedTaskId: null,
  })
  assert.deepEqual(detailNavigationReducer(
    detailNavigationReducer(opened, { type: 'CLOSE' }),
    { type: 'FOCUS_RESTORED' },
  ), initialDetailNavigationState)
})

test('canonical task routes encode exact ids and reject malformed or extra segments', () => {
  const navigation = todayWorkspace as typeof todayWorkspace & {
    planningTaskIdForPath(path: string): string | null
    planningTaskPath(taskId: string): string
  }

  assert.equal(typeof navigation.planningTaskPath, 'function')
  assert.equal(typeof navigation.planningTaskIdForPath, 'function')
  assert.equal(navigation.planningTaskPath('task/with spaces'), '/planning/tasks/task%2Fwith%20spaces')
  assert.equal(navigation.planningTaskIdForPath('/planning/tasks/task%2Fwith%20spaces'), 'task/with spaces')
  assert.equal(navigation.planningTaskIdForPath('/planning/tasks/'), null)
  assert.equal(navigation.planningTaskIdForPath('/planning/tasks/task-1/history'), null)
  assert.equal(navigation.planningTaskIdForPath('/planning/tasks/%E0%A4%A'), null)
})

test('latest task route loader suppresses stale success and stale failure', async () => {
  type RouteLoader = {
    invalidate(): void
    load<T>(taskId: string, request: (taskId: string) => Promise<T>): Promise<
      | { status: 'LOADED'; taskId: string; value: T }
      | { status: 'STALE' }
    >
  }
  const navigation = todayWorkspace as typeof todayWorkspace & {
    createLatestTaskRouteLoader(): RouteLoader
  }
  assert.equal(typeof navigation.createLatestTaskRouteLoader, 'function')

  const pending = new Map<string, {
    reject(error: Error): void
    resolve(value: string): void
  }>()
  const request = (taskId: string) => new Promise<string>((resolve, reject) => {
    pending.set(taskId, { reject, resolve })
  })
  const loader = navigation.createLatestTaskRouteLoader()
  const first = loader.load('past-task', request)
  const second = loader.load('future-task', request)

  pending.get('past-task')?.resolve('wrong historical task')
  pending.get('future-task')?.resolve('exact future task')

  assert.deepEqual(await first, { status: 'STALE' })
  assert.deepEqual(await second, {
    status: 'LOADED',
    taskId: 'future-task',
    value: 'exact future task',
  })

  const staleFailure = loader.load('missing-task', request)
  loader.invalidate()
  pending.get('missing-task')?.reject(new Error('not found'))
  assert.deepEqual(await staleFailure, { status: 'STALE' })
})
