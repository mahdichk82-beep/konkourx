import assert from 'node:assert/strict'
import test from 'node:test'
import {
  addBatchTaskRow,
  createBatchTaskRow,
  removeBatchTaskRow,
  submitBatchTaskRows,
  updateBatchTaskRowCurriculum,
  validateBatchTaskRows,
} from './batch-task-form.ts'

const selectedCurriculum = (rootId = 'node-1') => ({
  kind: 'V2' as const,
  selection: {
    version: 2 as const,
    selectors: [{ rootKind: 'NODE' as const, rootId, selector: 'SUBTREE' as const }],
  },
  summaries: [{ rootKind: 'NODE' as const, rootId, label: rootId, path: [rootId] }],
})

const validRow = () => ({
  ...createBatchTaskRow('row-1', '2026-09-15'),
  contentType: 'STUDY' as const,
  curriculum: selectedCurriculum(),
  description: '  مرور فصل  ',
  plannedMinutes: '90',
  plannedTestCount: '12',
  title: '  مطالعه زیست فصل ۳  ',
})

test('batch form validates required and non-negative row fields', () => {
  assert.equal(validateBatchTaskRows([validRow()]), null)
  assert.match(validateBatchTaskRows([{ ...validRow(), title: ' ' }]) ?? '', /عنوان/)
  assert.match(validateBatchTaskRows([{ ...validRow(), plannedMinutes: '-1' }]) ?? '', /زمان/)
  assert.match(validateBatchTaskRows([{ ...validRow(), plannedTestCount: '-1' }]) ?? '', /تعداد تست/)
  assert.match(validateBatchTaskRows([{ ...validRow(), contentType: '' }]) ?? '', /نوع کار/)
  assert.ok(validateBatchTaskRows([{
    ...validRow(),
    curriculum: { ...selectedCurriculum(), selection: { version: 2, selectors: [] } },
  }]))
})

test('batch form adds and removes rows without allowing an empty form', () => {
  const first = validRow()
  const second = createBatchTaskRow('row-2', '2026-09-16')
  const added = addBatchTaskRow([first], second)

  assert.deepEqual(added.map(({ id }) => id), ['row-1', 'row-2'])
  assert.deepEqual(removeBatchTaskRow(added, first.id), [second])
  assert.deepEqual(removeBatchTaskRow([first], first.id), [first])
})

test('batch rows own independent Picker values', () => {
  const first = validRow()
  const second = { ...validRow(), id: 'row-2', curriculum: selectedCurriculum('node-2') }
  const changed = updateBatchTaskRowCurriculum([first, second], first.id, selectedCurriculum('node-3'))

  assert.deepEqual(changed[0]?.curriculum, selectedCurriculum('node-3'))
  assert.deepEqual(changed[1]?.curriculum, selectedCurriculum('node-2'))
  assert.deepEqual(removeBatchTaskRow(changed, first.id)[0]?.curriculum, selectedCurriculum('node-2'))
})

test('batch form submits normalized rows and returns successful responses', async () => {
  let submitted: unknown
  const result = await submitBatchTaskRows([validRow()], async (tasks) => {
    submitted = tasks
    return { created: 1, tasks: [] }
  })

  assert.deepEqual(submitted, [{
    contentType: 'STUDY',
    curriculumSelection: {
      version: 2,
      selectors: [{ rootKind: 'NODE', rootId: 'node-1', selector: 'SUBTREE' }],
    },
    description: 'مرور فصل',
    plannedMinutes: 90,
    plannedTestCount: 12,
    scheduledFor: '2026-09-15',
    subjectId: null,
    title: 'مطالعه زیست فصل ۳',
    topicId: null,
  }])
  assert.deepEqual(result, { ok: true, value: { created: 1, tasks: [] } })
})

test('batch GENERAL omits both Curriculum contracts and legacy links', async () => {
  const row = {
    ...validRow(),
    contentType: 'GENERAL' as const,
    curriculum: selectedCurriculum(),
  }
  let submitted: unknown
  await submitBatchTaskRows([row], async (tasks) => {
    submitted = tasks
    return { created: 1, tasks: [] }
  })

  assert.deepEqual(submitted, [{
    contentType: 'GENERAL',
    description: 'مرور فصل',
    plannedMinutes: 90,
    plannedTestCount: 0,
    scheduledFor: '2026-09-15',
    subjectId: null,
    title: 'مطالعه زیست فصل ۳',
    topicId: null,
  }])
  const task = (submitted as Record<string, unknown>[])[0] ?? {}
  assert.equal('curriculumSelection' in task, false)
  assert.equal('curriculumTargets' in task, false)
})

test('batch form reports request errors without presenting success', async () => {
  const requestError = new Error('request failed')
  const result = await submitBatchTaskRows([validRow()], async () => {
    throw requestError
  })

  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.error, requestError)
})
