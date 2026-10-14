import assert from 'node:assert/strict'
import test from 'node:test'
import { loadAllStudents, loadPlanningTasks, planningRouteForPath } from './planning-data.ts'

test('global and Student-context planning paths resolve to one route contract', () => {
  const id = '00000000-0000-4000-8000-000000000001'
  assert.deepEqual(planningRouteForPath('/planning'), { kind: 'GLOBAL' })
  assert.deepEqual(planningRouteForPath(`/students/${id}/planning`), {
    kind: 'STUDENT',
    studentId: id,
  })
  assert.equal(planningRouteForPath(`/students/${id}`), null)
})

test('planner loads every authorized student page and de-duplicates records', async () => {
  const cursors: Array<string | undefined> = []
  const students = await loadAllStudents(async (cursor) => {
    cursors.push(cursor)
    if (!cursor) return {
      items: [{ id: 'student-1' }, { id: 'student-2' }],
      nextCursor: 'next',
    }
    return {
      items: [{ id: 'student-2' }, { id: 'student-3' }],
      nextCursor: null,
    }
  })

  assert.deepEqual(cursors, [undefined, 'next'])
  assert.deepEqual(students.map(({ id }) => id), ['student-1', 'student-2', 'student-3'])
})

test('planner stops safely when a server repeats its cursor', async () => {
  let calls = 0
  const students = await loadAllStudents(async () => {
    calls += 1
    return { items: [{ id: `student-${calls}` }], nextCursor: 'same' }
  })

  assert.equal(calls, 2)
  assert.deepEqual(students.map(({ id }) => id), ['student-1', 'student-2'])
})

test('planner task pagination keeps one copy of each persisted task', async () => {
  const tasks = await loadPlanningTasks(async (cursor) => cursor
    ? { items: [{ id: 'task-2' }, { id: 'task-3' }], nextCursor: null }
    : { items: [{ id: 'task-1' }, { id: 'task-2' }], nextCursor: 'page-2' })

  assert.deepEqual(tasks.map(({ id }) => id), ['task-1', 'task-2', 'task-3'])
})
