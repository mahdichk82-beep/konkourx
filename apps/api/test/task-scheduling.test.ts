import assert from 'node:assert/strict'
import test from 'node:test'
import {
  MINI_BOXES_PER_DAY,
  deriveMiniBoxSpan,
  validateTaskScheduleWindow,
} from '../src/task-scheduling/schedule.js'

test('a full planning day contains 96 fifteen-minute positions', () => {
  assert.equal(MINI_BOXES_PER_DAY, 96)
})

test('15:45 to 17:00 produces five mini-boxes', () => {
  const schedule = { startMinuteOfDay: 945, endMinuteOfDay: 1020 }
  assert.equal(validateTaskScheduleWindow(schedule), null)
  assert.equal(deriveMiniBoxSpan(schedule), 5)
})

test('legacy date-only tasks have no fabricated exact-time span', () => {
  assert.equal(validateTaskScheduleWindow({}), null)
  assert.equal(deriveMiniBoxSpan({}), null)
  assert.equal(deriveMiniBoxSpan({ startMinuteOfDay: null, endMinuteOfDay: null }), null)
})

test('schedule validation rejects incomplete, unaligned, reversed, and cross-midnight windows', () => {
  assert.equal(validateTaskScheduleWindow({ startMinuteOfDay: 600 }), 'PAIR_REQUIRED')
  assert.equal(validateTaskScheduleWindow({ startMinuteOfDay: null }), 'PAIR_REQUIRED')
  assert.equal(
    validateTaskScheduleWindow({ startMinuteOfDay: 601, endMinuteOfDay: 660 }),
    'NOT_ALIGNED',
  )
  assert.equal(
    validateTaskScheduleWindow({ startMinuteOfDay: 660, endMinuteOfDay: 600 }),
    'END_NOT_AFTER_START',
  )
  assert.equal(
    validateTaskScheduleWindow({ startMinuteOfDay: 1425, endMinuteOfDay: 15 }),
    'END_NOT_AFTER_START',
  )
})

test('00:00 to 24:00 is the largest valid same-day schedule', () => {
  const schedule = { startMinuteOfDay: 0, endMinuteOfDay: 1440 }
  assert.equal(validateTaskScheduleWindow(schedule), null)
  assert.equal(deriveMiniBoxSpan(schedule), 96)
})
