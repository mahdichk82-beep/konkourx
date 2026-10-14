import assert from 'node:assert/strict'
import test from 'node:test'
import type { DailyTask } from '../planning/planning-client.ts'
import {
  buildDashboardTodaySummary,
  loadDashboardTodayTasks,
} from './dashboard-today.ts'

const task = (overrides: Partial<DailyTask> = {}): DailyTask => ({
  actualSolvedTestCount: 0,
  completedAt: null,
  contentType: 'STUDY',
  createdAt: '2026-10-14T04:00:00.000Z',
  curriculum: { completedItemCount: 0, remainingItemCount: 0, targets: [], totalItemCount: 0 },
  deadlineMisses: [],
  description: null,
  endMinuteOfDay: null,
  estimatedMinutes: 30,
  id: 'task-1',
  plannedTestCount: 0,
  scheduledFor: '2026-10-14T00:00:00.000Z',
  skipReason: null,
  skippedAt: null,
  source: 'PERSONAL',
  startMinuteOfDay: null,
  status: 'PENDING',
  subjectId: null,
  title: 'مرور امروز',
  topicId: null,
  updatedAt: '2026-10-14T04:00:00.000Z',
  ...overrides,
})

test('dashboard loads every authorized Today page with the Tehran date key', async () => {
  const queries: { cursor?: string; date: string; limit: number }[] = []
  const result = await loadDashboardTodayTasks('2026-10-14', async (query) => {
    queries.push(query)
    return query.cursor
      ? { items: [task({ id: 'task-2' })], nextCursor: null }
      : { items: [task()], nextCursor: 'next-page' }
  })

  assert.deepEqual(queries, [
    { cursor: undefined, date: '2026-10-14', limit: 100 },
    { cursor: 'next-page', date: '2026-10-14', limit: 100 },
  ])
  assert.deepEqual(result.map(({ id }) => id), ['task-1', 'task-2'])
})

test('dashboard summary reports only real task lifecycle counts', () => {
  const summary = buildDashboardTodaySummary([
    task(),
    task({ id: 'partial', status: 'PARTIAL' }),
    task({ id: 'skipped', status: 'SKIPPED' }),
    task({ completedAt: '2026-10-14T08:00:00.000Z', id: 'completed', status: 'COMPLETED' }),
  ], '2026-10-14')

  assert.equal(summary.total, 4)
  assert.deepEqual(summary.statuses, [
    { count: 1, label: 'در انتظار انجام', status: 'PENDING' },
    { count: 1, label: 'بخشی انجام‌شده', status: 'PARTIAL' },
    { count: 1, label: 'ردشده', status: 'SKIPPED' },
    { count: 1, label: 'انجام‌شده', status: 'COMPLETED' },
  ])
  assert.deepEqual(buildDashboardTodaySummary([], '2026-10-14'), {
    statuses: [],
    total: 0,
  })
})
