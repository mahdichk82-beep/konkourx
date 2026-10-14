import assert from 'node:assert/strict'
import test from 'node:test'

import { prepareTaskContent, taskOccursBeforeDate, taskOccursOnDate } from './task-content.ts'
import type { PlanningCurriculumValue } from '@konkourx/curriculum-browser'

const selected = (...selectors: Array<{ id: string; selector: 'EXACT' | 'SUBTREE' }>): PlanningCurriculumValue => ({
  kind: 'V2',
  selection: {
    version: 2,
    selectors: selectors.map(({ id, selector }) => ({ rootKind: 'NODE', rootId: id, selector })),
  },
  summaries: selectors.map(({ id }) => ({ rootKind: 'NODE', rootId: id, label: id, path: ['زیست', id] })),
})

const historical: PlanningCurriculumValue = {
  kind: 'PRESERVED_HISTORICAL',
  snapshots: [{
    curriculumRefId: 'legacy',
    labelSnapshot: 'مبحث قدیمی',
    pathSnapshot: ['زیست', 'مبحث قدیمی'],
    position: 0,
    referenceKind: 'NODE',
    representationIdSnapshot: 'rep-biology',
    selectionMode: 'WHOLE',
  }],
}

test('new task requires a type and STUDY requires a non-empty explicit v2 value', () => {
  assert.equal(prepareTaskContent('', selected({ id: 'n1', selector: 'EXACT' })).ok, false)
  assert.equal(prepareTaskContent('STUDY', selected()).ok, false)
  assert.equal(prepareTaskContent('STUDY', historical).ok, false)
})

test('STUDY emits only v2 selection and null legacy links', () => {
  assert.deepEqual(prepareTaskContent('STUDY', selected(
    { id: 'n1', selector: 'EXACT' },
    { id: 'n2', selector: 'SUBTREE' },
  )), {
    ok: true,
    contentType: 'STUDY',
    curriculumSelection: {
      version: 2,
      selectors: [
        { rootKind: 'NODE', rootId: 'n1', selector: 'EXACT' },
        { rootKind: 'NODE', rootId: 'n2', selector: 'SUBTREE' },
      ],
    },
    subjectId: null,
    topicId: null,
  })
})

test('GENERAL omits every Curriculum contract even when stale picker state exists', () => {
  const prepared = prepareTaskContent('GENERAL', selected({ id: 'stale', selector: 'SUBTREE' }))
  assert.deepEqual(prepared, {
    ok: true,
    contentType: 'GENERAL',
    subjectId: null,
    topicId: null,
  })
  assert.equal('curriculumSelection' in prepared, false)
  assert.equal('curriculumTargets' in prepared, false)
})

test('a newly created task appears in Today only on its scheduled date', () => {
  assert.equal(taskOccursOnDate('2026-10-07T12:00:00.000Z', '2026-10-07'), true)
  assert.equal(taskOccursOnDate('2026-10-07T23:30:00.000-07:00', '2026-10-07'), true)
  assert.equal(taskOccursOnDate('2026-10-08T12:00:00.000Z', '2026-10-07'), false)
  assert.equal(taskOccursOnDate('2026-02-29T00:00:00.000Z', '2026-02-29'), false)
  assert.equal(taskOccursOnDate('2026-10-07 trailing-data', '2026-10-07'), false)
  assert.equal(taskOccursBeforeDate('2026-10-06T00:00:00.000Z', '2026-10-07'), true)
  assert.equal(taskOccursBeforeDate('2026-10-07T00:00:00.000Z', '2026-10-07'), false)
  assert.equal(taskOccursBeforeDate('invalid', '2026-10-07'), false)
})
