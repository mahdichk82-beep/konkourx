import assert from 'node:assert/strict'
import test from 'node:test'
import {
  addBatchTaskRow,
  createBatchTaskRow,
  removeBatchTaskRow,
  submitBatchTaskRows,
  validateBatchTaskRows,
} from './batch-task-form.ts'

const validRow = () => ({
  ...createBatchTaskRow('row-1', '2026-09-15'),
  contentType: 'STUDY' as const,
  curriculumTargets: [{ referenceKind: 'NODE' as const, curriculumRefId: 'node-1', selectionMode: 'EXACT' as const }],
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
  assert.match(validateBatchTaskRows([{ ...validRow(), curriculumTargets: [] }]) ?? '', /مبحث/)
})

test('batch form adds and removes rows without allowing an empty form', () => {
  const first = validRow()
  const second = createBatchTaskRow('row-2', '2026-09-16')
  const added = addBatchTaskRow([first], second)

  assert.deepEqual(added.map(({ id }) => id), ['row-1', 'row-2'])
  assert.deepEqual(removeBatchTaskRow(added, first.id), [second])
  assert.deepEqual(removeBatchTaskRow([first], first.id), [first])
})

test('batch form submits normalized rows and returns successful responses', async () => {
  let submitted: unknown
  const result = await submitBatchTaskRows([validRow()], async (tasks) => {
    submitted = tasks
    return { created: 1, tasks: [] }
  })

  assert.deepEqual(submitted, [{
    contentType: 'STUDY',
    curriculumTargets: [{ referenceKind: 'NODE', curriculumRefId: 'node-1', selectionMode: 'EXACT' }],
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

test('batch GENERAL writes no targets or legacy links, while STUDY writes only exact nodes', async () => {
  const row = {
    ...validRow(),
    contentType: 'GENERAL' as const,
    curriculumTargets: [
      { referenceKind: 'NODE' as const, curriculumRefId: 'node-1', selectionMode: 'EXACT' as const },
    ],
  }
  let submitted: unknown
  await submitBatchTaskRows([row], async (tasks) => {
    submitted = tasks
    return { created: 1, tasks: [] }
  })

  assert.deepEqual(submitted, [{
    contentType: 'GENERAL',
    curriculumTargets: [],
    description: 'مرور فصل',
    plannedMinutes: 90,
    plannedTestCount: 0,
    scheduledFor: '2026-09-15',
    subjectId: null,
    title: 'مطالعه زیست فصل ۳',
    topicId: null,
  }])
  assert.match(validateBatchTaskRows([{ ...validRow(), curriculumTargets: [
    { referenceKind: 'NODE', curriculumRefId: 'node-1', selectionMode: 'WHOLE' },
  ] }]) ?? '', /مبحث/)
})

test('batch form reports request errors without presenting success', async () => {
  const requestError = new Error('request failed')
  const result = await submitBatchTaskRows([validRow()], async () => {
    throw requestError
  })

  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.error, requestError)
})
