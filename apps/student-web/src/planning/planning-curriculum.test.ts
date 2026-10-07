import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('personal task client exposes canonical create and replacement contracts', () => {
  const source = readFileSync(new URL('./planning-client.ts', import.meta.url), 'utf8')
  assert.match(source, /curriculumTargets: PlanningCurriculumTargetInput\[\]/)
  assert.match(source, /replaceTaskCurriculumTargets/)
  assert.match(source, /daily-tasks\/\$\{encodeURIComponent\(id\)\}\/curriculum-targets/)
  assert.match(source, /JSON\.stringify\(\{ curriculumTargets \}\)/)
});

test('Student Planning uses the profile-bound picker without a track selector', () => {
  const source = readFileSync(new URL('../pages/TodayPlanningPage.tsx', import.meta.url), 'utf8')
  assert.match(source, /PlanningCurriculumField/)
  assert.match(source, /createStudentCurriculumClient/)
  assert.match(source, /prepareTaskContent/)
  assert.match(source, /replaceTaskCurriculumTargets/)
  assert.match(source, /replaceChangedPlanningTargets/)
  assert.match(source, /canEditPlanningCurriculum/)
  assert.match(source, /loadPlanningTaskDrafts/)
  assert.doesNotMatch(source, /trackSelector|selectedTrack|<select[^>]*id="[^"]*track/)
});

test('canonical create explicitly sends type and no legacy Subject or Topic links', () => {
  const source = readFileSync(new URL('../pages/TodayPlanningPage.tsx', import.meta.url), 'utf8')
  assert.match(source, /contentType: taskContent\.contentType/)
  assert.match(source, /subjectId: taskContent\.subjectId/)
  assert.match(source, /topicId: taskContent\.topicId/)
  assert.doesNotMatch(source, /id="task-subject"|id="task-topic"/)
  assert.match(source, /scheduledFor: taskScheduledFor/)
});
