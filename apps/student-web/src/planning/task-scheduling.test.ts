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

test('volumetric schedules serialize both time fields as null without discarding draft times', () => {
  const draft = { mode: 'VOLUMETRIC' as const, startTime: '08:15', endTime: '09:45' }
  assert.deepEqual(prepareTaskSchedule(draft), {
    ok: true,
    value: { startMinuteOfDay: null, endMinuteOfDay: null },
  })
  assert.deepEqual(draft, { mode: 'VOLUMETRIC', startTime: '08:15', endTime: '09:45' })
})

test('timed schedules require ordered 15-minute values and accept 24:00 only as an end', () => {
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
    startTime: '08:10',
    endTime: '09:00',
  }).ok, false)
  assert.equal(prepareTaskSchedule({
    mode: 'TIMED',
    startTime: '09:00',
    endTime: '09:00',
  }).ok, false)
})

test('persisted schedules initialize edit drafts and unchanged historical values stay unchanged', () => {
  const timed = scheduleDraftFromTask(495, 585)
  assert.deepEqual(timed, { mode: 'TIMED', startTime: '08:15', endTime: '09:45' })
  assert.equal(scheduleHasChanged(timed, 495, 585), false)

  const volumetric = scheduleDraftFromTask(null, null)
  assert.deepEqual(volumetric, createScheduleDraft())
  assert.equal(scheduleHasChanged(volumetric, null, null), false)
})

test('schedule labels separate fixed time from estimated study duration and dates use Persian calendar', () => {
  assert.equal(formatTaskSchedule(null, null), 'حجمی (بدون ساعت ثابت)')
  assert.equal(formatTaskSchedule(495, 585), 'ساعت ثابت ۰۸:۱۵ تا ۰۹:۴۵')
  assert.match(formatJalaliDate('2026-10-09'), /۱۴۰۵/)
})

test('Student creation and editing use explicit schedule payloads and accessible schedule controls', () => {
  const page = readFileSync(new URL('../pages/TodayPlanningPage.tsx', import.meta.url), 'utf8')
  const client = readFileSync(new URL('./planning-client.ts', import.meta.url), 'utf8')
  assert.match(page, /<TaskScheduleFields/)
  assert.match(page, /startMinuteOfDay: schedule\.value\.startMinuteOfDay/)
  assert.match(page, /endMinuteOfDay: schedule\.value\.endMinuteOfDay/)
  assert.match(page, /formatJalaliDate\(taskScheduledFor\)/)
  assert.match(client, /startMinuteOfDay: number \| null/)
  assert.match(client, /endMinuteOfDay: number \| null/)
})
