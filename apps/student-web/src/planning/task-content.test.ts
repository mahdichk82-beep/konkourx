import assert from 'node:assert/strict'
import test from 'node:test'

import { prepareTaskContent, taskOccursOnDate } from './task-content.ts'

const selected = (id: string) => ({
  kind: 'NODE' as const,
  displayPath: ['زیست', id],
  selection: {
    breadcrumb: [],
    entryId: 'biology',
    label: id,
    mode: 'EXACT' as const,
    nodeId: id,
    trackId: 'EXPERIMENTAL' as const,
  },
})

test('new task requires a type and STUDY requires an exact node', () => {
  assert.equal(prepareTaskContent('', []).ok, false)
  assert.equal(prepareTaskContent('STUDY', []).ok, false)
  assert.equal(prepareTaskContent('STUDY', [{ ...selected('n1'), selection: { ...selected('n1').selection, mode: 'WHOLE' } }]).ok, false)
})

test('STUDY emits exact nodes without legacy links and GENERAL ignores stale selection', () => {
  assert.deepEqual(prepareTaskContent('STUDY', [selected('n1'), selected('n2')]), {
    ok: true,
    contentType: 'STUDY',
    curriculumTargets: [
      { referenceKind: 'NODE', curriculumRefId: 'n1', selectionMode: 'EXACT' },
      { referenceKind: 'NODE', curriculumRefId: 'n2', selectionMode: 'EXACT' },
    ],
    subjectId: null,
    topicId: null,
  })
  assert.deepEqual(prepareTaskContent('GENERAL', [selected('n1')]), {
    ok: true,
    contentType: 'GENERAL',
    curriculumTargets: [],
    subjectId: null,
    topicId: null,
  })
})

test('a newly created task appears in Today only on its scheduled date', () => {
  assert.equal(taskOccursOnDate('2026-10-07T12:00:00.000Z', '2026-10-07'), true)
  assert.equal(taskOccursOnDate('2026-10-08T12:00:00.000Z', '2026-10-07'), false)
})
