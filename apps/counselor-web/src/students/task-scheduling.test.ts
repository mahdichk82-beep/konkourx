import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  createScheduleDraft,
  formatJalaliDate,
  formatTaskSchedule,
  prepareTaskSchedule,
  scheduleDraftFromTask,
  scheduleHasChanged,
  taskEndTimeOptions,
} from './task-scheduling.ts'

test('volumetric schedules serialize both time fields as null and retain unsaved time values', () => {
  const draft = { mode: 'VOLUMETRIC' as const, startTime: '10:00', endTime: '11:30' }
  assert.deepEqual(prepareTaskSchedule(draft), {
    ok: true,
    value: { startMinuteOfDay: null, endMinuteOfDay: null },
  })
  assert.deepEqual(draft, { mode: 'VOLUMETRIC', startTime: '10:00', endTime: '11:30' })
})

test('timed schedules enforce 15-minute same-day ranges and include backend-supported 24:00', () => {
  assert.deepEqual(prepareTaskSchedule({
    mode: 'TIMED',
    startTime: '23:45',
    endTime: '24:00',
  }), {
    ok: true,
    value: { startMinuteOfDay: 1425, endMinuteOfDay: 1440 },
  })
  assert.equal(taskEndTimeOptions.at(-1)?.value, '24:00')
  assert.equal(prepareTaskSchedule({
    mode: 'TIMED',
    startTime: '23:45',
    endTime: '00:15',
  }).ok, false)
})

test('persisted values initialize edits and remain unchanged until an intentional schedule change', () => {
  const timed = scheduleDraftFromTask(900, 1020)
  assert.deepEqual(timed, { mode: 'TIMED', startTime: '15:00', endTime: '17:00' })
  assert.equal(scheduleHasChanged(timed, 900, 1020), false)
  assert.equal(scheduleHasChanged({ ...timed, mode: 'VOLUMETRIC' }, 900, 1020), true)

  const volumetric = scheduleDraftFromTask(null, null)
  assert.deepEqual(volumetric, createScheduleDraft())
})

test('Persian labels distinguish fixed scheduling from estimated duration', () => {
  assert.equal(formatTaskSchedule(null, null), 'حجمی (بدون ساعت ثابت)')
  assert.equal(formatTaskSchedule(900, 1020), 'ساعت ثابت ۱۵:۰۰ تا ۱۷:۰۰')
  assert.match(formatJalaliDate('2026-10-09'), /۱۴۰۵/)
})

test('Counselor single, batch, and editing flows all expose scheduling controls', () => {
  for (const filename of ['StudentTaskForm.tsx', 'StudentBatchTaskForm.tsx', 'StudentTaskList.tsx']) {
    const source = readFileSync(new URL(`./${filename}`, import.meta.url), 'utf8')
    assert.match(source, /<TaskScheduleFields/, filename)
    assert.match(source, /formatJalaliDate/, filename)
  }
  const batch = readFileSync(new URL('./batch-task-form.ts', import.meta.url), 'utf8')
  assert.match(batch, /startMinuteOfDay: schedule\.value\.startMinuteOfDay/)
  assert.match(batch, /endMinuteOfDay: schedule\.value\.endMinuteOfDay/)
})
