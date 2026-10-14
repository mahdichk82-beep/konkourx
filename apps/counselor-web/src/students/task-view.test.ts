import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  filterStudentWorkspaceTasks,
  mergeVisibleTask,
  studentTaskDateRange,
} from './task-view.ts'
import type { CounselorTask, CounselorVisibleTask } from './student-tasks-client.ts'

test('Curriculum replacement preserves list-only study-session guards', () => {
  const visible = {
    id: 'task-1',
    curriculum: { targets: [{ curriculumRefId: 'old' }] },
    completedStudySessionCount: 2,
    hasActiveStudySession: true,
    hasValidAssessmentAttempt: true,
    recordedMinutes: 45,
    studySessionCount: 3,
  } as unknown as CounselorVisibleTask
  const replacement = {
    id: 'task-1',
    curriculum: { targets: [{ curriculumRefId: 'new' }] },
  } as unknown as CounselorTask

  const result = mergeVisibleTask(visible, replacement)
  assert.deepEqual(result.curriculum.targets, replacement.curriculum.targets)
  assert.equal(result.completedStudySessionCount, 2)
  assert.equal(result.hasActiveStudySession, true)
  assert.equal(result.hasValidAssessmentAttempt, true)
  assert.equal(result.recordedMinutes, 45)
  assert.equal(result.studySessionCount, 3)
})

test('Curriculum replacement client is typed to the narrower API response', () => {
  const source = readFileSync(new URL('./student-tasks-client.ts', import.meta.url), 'utf8')
  assert.match(source, /replaceCurriculumSelection\([\s\S]*?\): Promise<CounselorTask>/)
})

test('Counselor task cards render authorized durable missed scheduled days separately', () => {
  const source = readFileSync(new URL('./StudentTaskList.tsx', import.meta.url), 'utf8')

  assert.match(source, /task\.deadlineMisses\.length > 0/)
  assert.match(source, /task\.deadlineMisses\.map/)
  assert.match(source, /سابقه موعدهای انجام‌نشده/)
})

const visibleTask = (
  id: string,
  status: CounselorVisibleTask['status'],
  scheduledFor: string,
  progress: Partial<Pick<CounselorVisibleTask,
    'actualSolvedTestCount' | 'completedStudySessionCount' | 'recordedMinutes' | 'studySessionCount'>> = {},
) => ({
  actualSolvedTestCount: progress.actualSolvedTestCount ?? 0,
  completedStudySessionCount: progress.completedStudySessionCount ?? 0,
  completedAt: status === 'COMPLETED' ? `${scheduledFor}T10:00:00.000Z` : null,
  curriculum: { completedItemCount: 0, remainingItemCount: 0, targets: [], totalItemCount: 0 },
  id,
  recordedMinutes: progress.recordedMinutes ?? 0,
  scheduledFor,
  status,
  studySessionCount: progress.studySessionCount ?? 0,
} as unknown as CounselorVisibleTask)

test('Student Workspace day view keeps every outcome scheduled for the selected day', () => {
  const tasks = [
    visibleTask('pending', 'PENDING', '2026-10-12'),
    visibleTask('completed', 'COMPLETED', '2026-10-12'),
    visibleTask('partial', 'PARTIAL', '2026-10-12'),
    visibleTask('skipped', 'SKIPPED', '2026-10-12'),
    visibleTask('other-day', 'PENDING', '2026-10-13'),
  ]

  assert.deepEqual(filterStudentWorkspaceTasks(tasks, {
    from: '2026-10-12',
    tab: 'TODAY',
    to: '2026-10-12',
  }).map(({ id }) => id), ['pending', 'completed', 'partial', 'skipped'])
})

test('Student Workspace tabs filter existing statuses without creating lifecycle states', () => {
  const tasks = [
    visibleTask('pending', 'PENDING', '2026-10-10'),
    visibleTask('pending-progress', 'PENDING', '2026-10-11', { recordedMinutes: 15 }),
    visibleTask('pending-history-only', 'PENDING', '2026-10-11', { studySessionCount: 1 }),
    visibleTask('pending-completed-session', 'PENDING', '2026-10-11', { completedStudySessionCount: 1, studySessionCount: 1 }),
    visibleTask('completed', 'COMPLETED', '2026-10-12'),
    visibleTask('partial', 'PARTIAL', '2026-10-13'),
    visibleTask('skipped', 'SKIPPED', '2026-10-14'),
  ]
  const range = { from: '2026-10-10', to: '2026-10-16' }

  assert.deepEqual(filterStudentWorkspaceTasks(tasks, { ...range, tab: 'COMPLETED' }).map(({ id }) => id), ['completed'])
  assert.deepEqual(filterStudentWorkspaceTasks(tasks, { ...range, tab: 'UNFINISHED' }).map(({ id }) => id), ['pending', 'pending-progress', 'pending-history-only', 'pending-completed-session', 'skipped'])
  assert.deepEqual(filterStudentWorkspaceTasks(tasks, { ...range, tab: 'PARTIAL' }).map(({ id }) => id), ['pending-progress', 'pending-completed-session', 'partial'])
  assert.equal(tasks[1]?.status, 'PENDING')
  assert.equal(tasks[5]?.status, 'PARTIAL')
})

test('Student Workspace week range is Saturday through Friday', () => {
  assert.deepEqual(studentTaskDateRange('2026-10-12', 'WEEK'), {
    from: '2026-10-10',
    to: '2026-10-16',
  })
  assert.deepEqual(studentTaskDateRange('2026-10-12', 'DAY'), {
    from: '2026-10-12',
    to: '2026-10-12',
  })
})
