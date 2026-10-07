import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { mergeVisibleTask } from './task-view.ts'
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
  assert.match(source, /replaceCurriculumTargets\([\s\S]*?\): Promise<CounselorTask>/)
})
