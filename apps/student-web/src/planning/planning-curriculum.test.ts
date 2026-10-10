import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  canReplacePlanningCurriculum,
  planningCurriculumValueFromSnapshots,
  replaceChangedPlanningCurriculum,
  type PlanningCurriculumTargetSnapshot,
} from '../../../../packages/curriculum-browser/src/planning.ts'
import { requestTaskCurriculumItemToggle } from './task-completion.ts'

test('Curriculum execution item toggle uses the existing authorized endpoint and boolean contract', async () => {
  const calls: Array<[string, RequestInit | undefined]> = []
  const response = { id: 'task-1' }
  const result = await requestTaskCurriculumItemToggle(
    async (path, init) => {
      calls.push([path, init])
      return response
    },
    'task/one',
    'item/two',
    true,
  )

  assert.equal(result, response)
  assert.deepEqual(calls, [[
    '/student/daily-tasks/task%2Fone/curriculum-items/item%2Ftwo',
    { body: JSON.stringify({ completed: true }), method: 'PATCH' },
  ]])
})

test('personal task client exposes canonical create and replacement contracts', () => {
  const source = readFileSync(new URL('./planning-client.ts', import.meta.url), 'utf8')
  assert.match(source, /curriculumSelection\?: CurriculumSelectionV2/)
  assert.match(source, /replaceTaskCurriculumSelection/)
  assert.match(source, /daily-tasks\/\$\{encodeURIComponent\(id\)\}\/curriculum-targets/)
  assert.match(source, /JSON\.stringify\(\{ curriculumSelection \}\)/)
  assert.doesNotMatch(source, /PlanningCurriculumTargetInput|curriculumTargets:/)
});

test('Student Planning uses the profile-bound picker without a track selector', () => {
  const source = readFileSync(new URL('../pages/TodayPlanningPage.tsx', import.meta.url), 'utf8')
  assert.match(source, /PlanningCurriculumField/)
  assert.match(source, /createStudentCurriculumClient/)
  assert.match(source, /prepareTaskContent/)
  assert.match(source, /replaceTaskCurriculumSelection/)
  assert.match(source, /replaceChangedPlanningCurriculum/)
  assert.match(source, /canReplacePlanningCurriculum/)
  assert.match(source, /planningCurriculumValueFromSnapshots/)
  assert.doesNotMatch(source, /loadPlanningTaskDrafts|PlanningTargetDraftItem/)
  assert.doesNotMatch(source, /trackSelector|selectedTrack|<select[^>]*id="[^"]*track/)
  assert.match(source, /\}, \[tasks, overdueTasks, executionRevision\]\)/)
  assert.match(source, /\[id, 'LOADING'\]/)
});

test('canonical create explicitly sends type and no legacy Subject or Topic links', () => {
  const source = readFileSync(new URL('../pages/TodayPlanningPage.tsx', import.meta.url), 'utf8')
  assert.match(source, /contentType: taskContent\.contentType/)
  assert.match(source, /\.\.\.\(taskContent\.contentType === 'STUDY'/)
  assert.match(source, /curriculumSelection: taskContent\.curriculumSelection/)
  assert.match(source, /subjectId: taskContent\.subjectId/)
  assert.match(source, /topicId: taskContent\.topicId/)
  assert.doesNotMatch(source, /id="task-subject"|id="task-topic"/)
  assert.match(source, /scheduledFor: taskScheduledFor/)
});

const snapshot = (id: string, selectionMode: 'EXACT' | 'SUBTREE'): PlanningCurriculumTargetSnapshot => ({
  curriculumRefId: id,
  labelSnapshot: `label-${id}`,
  pathSnapshot: ['زیست', `label-${id}`],
  position: selectionMode === 'EXACT' ? 0 : 1,
  referenceKind: 'NODE',
  representationIdSnapshot: 'rep-biology',
  selectionMode,
})

test('unchanged stored EXACT and SUBTREE selection performs no Student replacement', async () => {
  const originals = [snapshot('exact', 'EXACT'), snapshot('branch', 'SUBTREE')]
  const value = planningCurriculumValueFromSnapshots(originals)
  let calls = 0
  const result = await replaceChangedPlanningCurriculum(
    originals,
    value,
    {
      actor: 'student', contentType: 'STUDY', source: 'PERSONAL', status: 'PENDING',
      completedItemCount: 0, hasActiveStudySession: false, hasStudyHistory: false,
    },
    async () => { calls += 1; return null },
  )
  assert.deepEqual(result, { kind: 'UNCHANGED' })
  assert.equal(calls, 0)
})

test('Student lifecycle and provenance locks reject Curriculum replacement', () => {
  const base = {
    actor: 'student' as const,
    contentType: 'STUDY' as const,
    source: 'PERSONAL' as const,
    status: 'PENDING' as const,
    completedItemCount: 0,
    hasActiveStudySession: false,
    hasStudyHistory: false,
  }
  for (const context of [
    { ...base, source: 'COUNSELOR' as const },
    { ...base, status: 'COMPLETED' as const },
    { ...base, completedItemCount: 1 },
    { ...base, hasActiveStudySession: true },
    { ...base, hasStudyHistory: true },
  ]) assert.equal(canReplacePlanningCurriculum(context), false)
})

test('stored snapshot summaries remain available without catalog or track access', () => {
  const value = planningCurriculumValueFromSnapshots([snapshot('branch', 'SUBTREE')])
  assert.equal(value.kind, 'V2')
  if (value.kind !== 'V2') assert.fail('expected v2 value')
  assert.deepEqual(value.summaries, [{
    rootKind: 'NODE', rootId: 'branch', label: 'label-branch',
    path: ['زیست', 'label-branch'], representationIdSnapshot: 'rep-biology',
  }])
})
