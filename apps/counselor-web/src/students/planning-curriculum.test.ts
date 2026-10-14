import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  canReplacePlanningCurriculum,
  planningCurriculumValueFromSnapshots,
  replaceChangedPlanningCurriculum,
  type PlanningCurriculumEditContext,
  type PlanningCurriculumTargetSnapshot,
} from '../../../../packages/curriculum-browser/src/planning.ts'

const snapshot = (selectionMode: 'EXACT' | 'SUBTREE' | 'WHOLE' = 'EXACT'): PlanningCurriculumTargetSnapshot => ({
  curriculumRefId: 'node-1',
  labelSnapshot: 'Node 1',
  pathSnapshot: ['Node 1'],
  position: 0,
  referenceKind: 'NODE',
  representationIdSnapshot: 'representation-1',
  selectionMode,
})

const editableContext: PlanningCurriculumEditContext = {
  actor: 'counselor',
  completedItemCount: 0,
  contentType: 'STUDY',
  hasActiveStudySession: false,
  hasStudyHistory: false,
  hasValidAssessmentAttempt: false,
  source: 'COUNSELOR',
  status: 'PENDING',
}

test('Counselor client persists v2 selection through assigned-Student task routes', () => {
  const source = readFileSync(new URL('./student-tasks-client.ts', import.meta.url), 'utf8')
  assert.match(source, /curriculumSelection\?: CurriculumSelectionV2/)
  assert.match(source, /replaceCurriculumSelection/)
  assert.match(source, /tasks\/\$\{encodeURIComponent\(taskId\)\}\/curriculum-targets/)
  assert.match(source, /JSON\.stringify\(\{ curriculumSelection \}\)/)
});

test('single, batch, and edit flows use the selected Student-bound Picker', () => {
  for (const filename of ['StudentTaskForm.tsx', 'StudentBatchTaskForm.tsx', 'StudentTaskList.tsx']) {
    const source = readFileSync(new URL(`./${filename}`, import.meta.url), 'utf8')
    assert.match(source, /PlanningCurriculumField/, filename)
    assert.match(source, /createCounselorCurriculumClient/, filename)
    assert.match(source, /contextLabel=\{studentLabel\}/, filename)
    assert.match(source, /\[studentId\]/, filename)
    assert.doesNotMatch(source, /trackSelector|selectedTrack|<select[^>]*id="[^"]*track/, filename)
  }
});

test('Unified Composer keeps the official selectable Picker bound to each task draft', () => {
  const source = readFileSync(new URL('../planning/UnifiedTaskComposer.tsx', import.meta.url), 'utf8')
  assert.match(source, /PlanningCurriculumField/)
  assert.match(source, /createCounselorCurriculumClient/)
  assert.match(source, /client=\{curriculumClient\}/)
  assert.match(source, /value=\{task\.curriculum\}/)
  assert.match(source, /onChange=\{\(value\) => updateTask\(task\.id, 'curriculum', value\)\}/)
  assert.match(source, /contentType === 'STUDY'/)
})

test('Counselor canonical writes send explicit content type without legacy links', () => {
  const single = readFileSync(new URL('./StudentTaskForm.tsx', import.meta.url), 'utf8')
  const batch = readFileSync(new URL('./batch-task-form.ts', import.meta.url), 'utf8')
  assert.match(single, /contentType,/)
  assert.match(single, /subjectId: null/)
  assert.match(single, /topicId: null/)
  assert.match(batch, /contentType: row\.contentType/)
  assert.match(batch, /subjectId: null/)
  assert.match(batch, /topicId: null/)
  assert.doesNotMatch(single, /curriculumTargets/)
  assert.doesNotMatch(batch, /curriculumTargets/)
});

test('task editing remains lifecycle-bound and selected-Student-bound', () => {
  const source = readFileSync(new URL('./StudentTaskList.tsx', import.meta.url), 'utf8')
  assert.match(source, /task\.source !== 'COUNSELOR'/)
  assert.match(source, /task\.status !== 'PENDING'/)
  assert.match(source, /task\.completedStudySessionCount > 0/)
  assert.match(source, /task\.hasActiveStudySession/)
  assert.match(source, /task\.hasValidAssessmentAttempt/)
  assert.match(source, /task\.curriculum\.completedItemCount > 0/)
  assert.match(source, /replaceCurriculumSelection\(\s*studentId,\s*task\.id/)
  assert.match(source, /replaceChangedPlanningCurriculum/)
  assert.match(source, /canReplacePlanningCurriculum/)
  assert.match(source, /planningCurriculumValueFromSnapshots/)
});

test('Counselor replacement is skipped when unchanged and writes v2 exactly once when changed', async () => {
  const originals = [snapshot('SUBTREE')]
  let calls = 0
  const unchanged = await replaceChangedPlanningCurriculum(
    originals,
    planningCurriculumValueFromSnapshots(originals),
    editableContext,
    async () => { calls += 1; return 'unexpected' },
  )
  const changed = await replaceChangedPlanningCurriculum(
    originals,
    {
      kind: 'V2',
      selection: { version: 2, selectors: [{ rootKind: 'NODE', rootId: 'node-2', selector: 'EXACT' }] },
      summaries: [],
    },
    editableContext,
    async (selection) => { calls += 1; return selection },
  )

  assert.deepEqual(unchanged, { kind: 'UNCHANGED' })
  assert.equal(changed.kind, 'REPLACED')
  assert.equal(calls, 1)
})

test('Counselor replacement keeps historical and lifecycle-restricted selections read-only', () => {
  const restricted = [
    { ...editableContext, source: 'PERSONAL' as const },
    { ...editableContext, status: 'COMPLETED' as const },
    { ...editableContext, hasActiveStudySession: true },
    { ...editableContext, hasStudyHistory: true },
    { ...editableContext, hasValidAssessmentAttempt: true },
    { ...editableContext, completedItemCount: 1 },
  ]
  for (const context of restricted) assert.equal(canReplacePlanningCurriculum(context), false)
  assert.equal(planningCurriculumValueFromSnapshots([snapshot('WHOLE')]).kind, 'PRESERVED_HISTORICAL')
})
