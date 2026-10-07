import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('Counselor client persists targets through assigned-Student task routes', () => {
  const source = readFileSync(new URL('./student-tasks-client.ts', import.meta.url), 'utf8')
  assert.match(source, /curriculumTargets: PlanningCurriculumTargetInput\[\]/)
  assert.match(source, /replaceCurriculumTargets/)
  assert.match(source, /tasks\/\$\{encodeURIComponent\(taskId\)\}\/curriculum-targets/)
  assert.match(source, /JSON\.stringify\(\{ curriculumTargets \}\)/)
});

test('single, batch, and edit flows use the selected Student-bound Picker', () => {
  for (const filename of ['StudentTaskForm.tsx', 'StudentBatchTaskForm.tsx', 'StudentTaskList.tsx']) {
    const source = readFileSync(new URL(`./${filename}`, import.meta.url), 'utf8')
    assert.match(source, /PlanningCurriculumField/, filename)
    assert.match(source, /createCounselorCurriculumClient/, filename)
    assert.match(source, /contextLabel=\{studentLabel\}/, filename)
    assert.doesNotMatch(source, /trackSelector|selectedTrack|<select[^>]*id="[^"]*track/, filename)
  }
});

test('Counselor canonical writes send explicit content type without legacy links', () => {
  const single = readFileSync(new URL('./StudentTaskForm.tsx', import.meta.url), 'utf8')
  const batch = readFileSync(new URL('./batch-task-form.ts', import.meta.url), 'utf8')
  assert.match(single, /contentType,/)
  assert.match(single, /subjectId: null/)
  assert.match(single, /topicId: null/)
  assert.match(batch, /contentType: row\.contentType/)
  assert.match(batch, /subjectId: null/)
  assert.match(batch, /topicId: null/)
});

test('task editing remains lifecycle-bound and selected-Student-bound', () => {
  const source = readFileSync(new URL('./StudentTaskList.tsx', import.meta.url), 'utf8')
  assert.match(source, /task\.source !== 'COUNSELOR'/)
  assert.match(source, /task\.status !== 'PENDING'/)
  assert.match(source, /task\.completedStudySessionCount > 0/)
  assert.match(source, /task\.hasActiveStudySession/)
  assert.match(source, /task\.hasValidAssessmentAttempt/)
  assert.match(source, /task\.curriculum\.completedItemCount > 0/)
  assert.match(source, /replaceCurriculumTargets\(studentId, task\.id/)
  assert.match(source, /replaceChangedPlanningTargets/)
  assert.match(source, /canEditPlanningCurriculum/)
  assert.match(source, /loadPlanningTaskDrafts/)
});
