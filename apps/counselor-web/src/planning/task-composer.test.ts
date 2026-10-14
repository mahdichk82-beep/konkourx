import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createComposerTask,
  deriveTimedWindow,
  durationPresets,
  submitComposerTasks,
  toBatchInputs,
  validateComposerTasks,
  withComposerScheduleMode,
} from './task-composer.ts'

const selectedCurriculum = {
  kind: 'V2' as const,
  selection: {
    version: 2 as const,
    selectors: [{ rootKind: 'NODE' as const, rootId: 'biology', selector: 'SUBTREE' as const }],
  },
  summaries: [{ rootKind: 'NODE' as const, rootId: 'biology', label: 'زیست‌شناسی', path: ['زیست‌شناسی'] }],
}

test('composer exposes the approved quick duration presets', () => {
  assert.deepEqual(durationPresets, [30, 45, 60, 90, 120])
})

test('composer initializes only the selected task with a valid timeline window', () => {
  const task = createComposerTask('task-1', '2026-10-12', {
    endMinuteOfDay: 540,
    startMinuteOfDay: 495,
  })
  assert.equal(task.scheduledFor, '2026-10-12')
  assert.equal(task.scheduleMode, 'TIMED')
  assert.equal(task.startTime, '08:15')
  assert.equal(task.durationMinutes, '45')

  const blankTask = createComposerTask('task-2', '2026-10-12')
  assert.equal(blankTask.scheduleMode, 'TIMED')
  assert.equal(blankTask.startTime, '')
  assert.equal(blankTask.durationMinutes, '')
})

test('volumetric duration is optional and never creates artificial clock times', () => {
  const task = {
    ...createComposerTask('task-1', '2026-10-10'),
    contentType: 'GENERAL' as const,
    scheduleMode: 'VOLUMETRIC' as const,
    title: 'ورزش',
  }
  assert.equal(validateComposerTasks([task]), null)
  assert.deepEqual(toBatchInputs([task]), [{
    contentType: 'GENERAL',
    description: null,
    endMinuteOfDay: null,
    plannedMinutes: 0,
    plannedTestCount: 0,
    scheduledFor: '2026-10-10',
    startMinuteOfDay: null,
    subjectId: null,
    title: 'ورزش',
    topicId: null,
  }])
})

test('switching scheduling modes preserves both timed and volumetric input', () => {
  const timed = {
    ...createComposerTask('task-1', '2026-10-10'),
    durationMinutes: '60',
    plannedMinutes: '45',
    startTime: '08:15',
  }

  const volumetric = withComposerScheduleMode(timed, 'VOLUMETRIC')
  const restored = withComposerScheduleMode(volumetric, 'TIMED')

  assert.equal(volumetric.scheduleMode, 'VOLUMETRIC')
  assert.equal(restored.scheduleMode, 'TIMED')
  assert.equal(restored.startTime, '08:15')
  assert.equal(restored.durationMinutes, '60')
  assert.equal(restored.plannedMinutes, '45')
})

test('study payload includes Curriculum and planned tests while general omits both', () => {
  const study = {
    ...createComposerTask('study', '2026-10-10'),
    contentType: 'STUDY' as const,
    curriculum: selectedCurriculum,
    plannedMinutes: '60',
    plannedTestCount: '20',
    scheduleMode: 'VOLUMETRIC' as const,
    title: 'مطالعه زیست',
  }
  const general = {
    ...createComposerTask('general', '2026-10-10'),
    contentType: 'GENERAL' as const,
    curriculum: selectedCurriculum,
    plannedMinutes: '30',
    plannedTestCount: '99',
    scheduleMode: 'VOLUMETRIC' as const,
    title: 'پیاده‌روی',
  }
  assert.equal(validateComposerTasks([study, general]), null)
  const [studyInput, generalInput] = toBatchInputs([study, general])
  assert.deepEqual(studyInput?.curriculumSelection, selectedCurriculum.selection)
  assert.equal(studyInput?.plannedTestCount, 20)
  assert.equal('curriculumSelection' in generalInput!, false)
  assert.equal(generalInput?.plannedTestCount, 0)
})

test('timed start and duration derive a consistent aligned same-day window', () => {
  assert.deepEqual(deriveTimedWindow('22:30', 90), {
    endMinuteOfDay: 1440,
    endTime: '24:00',
    startMinuteOfDay: 1350,
  })
  assert.equal(deriveTimedWindow('23:45', 30), null)
  assert.equal(deriveTimedWindow('08:10', 30), null)
  assert.equal(deriveTimedWindow('08:00', 20), null)

  const timed = {
    ...createComposerTask('timed', '2026-10-10'),
    contentType: 'GENERAL' as const,
    durationMinutes: '45',
    scheduleMode: 'TIMED' as const,
    startTime: '08:15',
    title: 'جلسه',
  }
  assert.equal(validateComposerTasks([timed]), null)
  assert.deepEqual(toBatchInputs([timed])[0] && {
    endMinuteOfDay: toBatchInputs([timed])[0]?.endMinuteOfDay,
    plannedMinutes: toBatchInputs([timed])[0]?.plannedMinutes,
    startMinuteOfDay: toBatchInputs([timed])[0]?.startMinuteOfDay,
  }, { endMinuteOfDay: 540, plannedMinutes: 45, startMinuteOfDay: 495 })
})

test('composer rejects missing study Curriculum and timed windows crossing midnight', () => {
  const study = {
    ...createComposerTask('study', '2026-10-10'),
    contentType: 'STUDY' as const,
    title: 'مطالعه',
  }
  assert.match(validateComposerTasks([study]) ?? '', /مبحث/)

  const crossing = {
    ...createComposerTask('crossing', '2026-10-10'),
    contentType: 'GENERAL' as const,
    durationMinutes: '30',
    scheduleMode: 'TIMED' as const,
    startTime: '23:45',
    title: 'جلسه',
  }
  assert.match(validateComposerTasks([crossing]) ?? '', /همان روز/)
})

test('composer submits one or many tasks through one request and returns server failure unchanged', async () => {
  const draft = {
    ...createComposerTask('task-1', '2026-10-10'),
    contentType: 'GENERAL' as const,
    scheduleMode: 'VOLUMETRIC' as const,
    title: 'مرور برنامه',
  }
  let submitted: unknown
  const success = await submitComposerTasks([draft], async (tasks) => {
    submitted = tasks
    return { created: 1, tasks: [] }
  })
  assert.equal(success.ok, true)
  assert.deepEqual(submitted, toBatchInputs([draft]))

  const requestError = new Error('network failed')
  const failure = await submitComposerTasks([draft], async () => {
    throw requestError
  })
  assert.deepEqual(failure, { error: requestError, ok: false })
  assert.equal(draft.title, 'مرور برنامه')
})

test('composer validation failure does not call the batch request', async () => {
  let called = false
  const result = await submitComposerTasks(
    [createComposerTask('task-1', '2026-10-10')],
    async () => {
      called = true
      return { created: 1, tasks: [] }
    },
  )
  assert.equal(called, false)
  assert.equal(result.ok, false)
  if (!result.ok) assert.match(String(result.error), /عنوان/)
})
