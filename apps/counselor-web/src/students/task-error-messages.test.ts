import assert from 'node:assert/strict'
import test from 'node:test'

import { taskContentErrorMessage } from './task-error-messages.ts'

test('task content errors are safe Persian messages rather than raw API codes', () => {
  for (const code of [
    'STUDENT_TRACK_NOT_SET',
    'CURRICULUM_TARGET_NOT_IN_STUDENT_TRACK',
    'CURRICULUM_TARGET_NOT_SELECTABLE',
    'CURRICULUM_SELECTOR_LIMIT_EXCEEDED',
    'CURRICULUM_SELECTION_EMPTY',
    'TASK_STUDY_TARGET_REQUIRED',
    'TASK_GENERAL_TARGET_FORBIDDEN',
    'TASK_LEGACY_LINK_FORBIDDEN',
  ]) {
    const message = taskContentErrorMessage(code)
    assert.ok(message)
    assert.doesNotMatch(message, /STUDENT_|CURRICULUM_|TASK_/)
  }
  assert.equal(taskContentErrorMessage('UNKNOWN'), null)
})
