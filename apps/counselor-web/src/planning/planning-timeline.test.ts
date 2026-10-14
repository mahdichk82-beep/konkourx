import assert from 'node:assert/strict'
import test from 'node:test'
import {
  advanceTimelineSelection,
  groupTasksByDate,
  layoutTimedTasks,
  timelineSlotFromOffset,
  timelineHeight,
} from './planning-timeline.ts'

const timedTask = (
  id: string,
  startMinuteOfDay: number | null,
  endMinuteOfDay: number | null,
  scheduledFor = '2026-10-10T00:00:00.000Z',
) => ({ id, scheduledFor, startMinuteOfDay, endMinuteOfDay })

test('timeline positions timed tasks against the complete day and supports 24:00', () => {
  assert.equal(timelineHeight(false), 1152)
  assert.equal(timelineHeight(true), 1728)

  const [task] = layoutTimedTasks([
    timedTask('biology', 8 * 60, (9 * 60) + 30),
  ], false)
  assert.deepEqual(task && {
    height: task.height,
    top: task.top,
  }, { height: 72, top: 384 })

  const [lastQuarter] = layoutTimedTasks([
    timedTask('late', 23 * 60 + 45, 24 * 60),
  ], true)
  assert.deepEqual(lastQuarter && {
    height: lastQuarter.height,
    top: lastQuarter.top,
  }, { height: 18, top: 1710 })
})

test('timeline excludes volumetric tasks and groups all tasks by date', () => {
  const timed = timedTask('timed', 600, 660)
  const volumetric = timedTask('volumetric', null, null)
  assert.deepEqual(layoutTimedTasks([timed, volumetric], false).map(({ task }) => task.id), ['timed'])
  assert.deepEqual(
    [...groupTasksByDate([timed, volumetric]).entries()].map(([date, tasks]) => [date, tasks.map(({ id }) => id)]),
    [['2026-10-10', ['timed', 'volumetric']]],
  )
})

test('timeline assigns deterministic readable lanes to overlapping intervals', () => {
  const layout = layoutTimedTasks([
    timedTask('a', 480, 600),
    timedTask('b', 510, 540),
    timedTask('c', 570, 630),
    timedTask('d', 720, 780),
  ], false)
  assert.deepEqual(
    layout.map(({ conflict, lane, laneCount, task }) => ({ conflict, id: task.id, lane, laneCount })),
    [
      { conflict: true, id: 'a', lane: 0, laneCount: 2 },
      { conflict: true, id: 'b', lane: 1, laneCount: 2 },
      { conflict: true, id: 'c', lane: 1, laneCount: 2 },
      { conflict: false, id: 'd', lane: 0, laneCount: 1 },
    ],
  )
})

test('timeline pointer offsets snap to selectable 15-minute starts', () => {
  assert.equal(timelineSlotFromOffset(0, 960), 0)
  assert.equal(timelineSlotFromOffset(10, 960), 15)
  assert.equal(timelineSlotFromOffset(959, 960), 1440)
  assert.equal(timelineSlotFromOffset(960, 960), 1440)
})

test('timeline selection creates a same-day range and permits 24:00 only as an end', () => {
  const started = advanceTimelineSelection(null, '2026-10-12', 8 * 60)
  assert.deepEqual(started, {
    dateKey: '2026-10-12',
    endMinuteOfDay: null,
    startMinuteOfDay: 480,
  })

  assert.deepEqual(advanceTimelineSelection(started, '2026-10-12', 8 * 60), {
    dateKey: '2026-10-12',
    endMinuteOfDay: null,
    startMinuteOfDay: 480,
  })

  assert.deepEqual(advanceTimelineSelection(started, '2026-10-12', 8 * 60 + 45), {
    dateKey: '2026-10-12',
    endMinuteOfDay: 525,
    startMinuteOfDay: 480,
  })

  const finalSlot = advanceTimelineSelection(null, '2026-10-12', 1425)
  assert.deepEqual(advanceTimelineSelection(finalSlot, '2026-10-12', 1440), {
    dateKey: '2026-10-12',
    endMinuteOfDay: 1440,
    startMinuteOfDay: 1425,
  })
})

test('an earlier slot or a completed range begins a fresh timeline selection', () => {
  const started = advanceTimelineSelection(null, '2026-10-12', 600)
  assert.deepEqual(advanceTimelineSelection(started, '2026-10-12', 540), {
    dateKey: '2026-10-12',
    endMinuteOfDay: null,
    startMinuteOfDay: 540,
  })
  const completed = advanceTimelineSelection(started, '2026-10-12', 645)
  assert.deepEqual(advanceTimelineSelection(completed, '2026-10-13', 1440), {
    dateKey: '2026-10-13',
    endMinuteOfDay: null,
    startMinuteOfDay: 1425,
  })
})
