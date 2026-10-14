export type TimelineTaskInput = {
  endMinuteOfDay: number | null
  id: string
  scheduledFor: string
  startMinuteOfDay: number | null
}

export type PositionedTimelineTask<T extends TimelineTaskInput> = {
  conflict: boolean
  height: number
  lane: number
  laneCount: number
  task: T
  top: number
}

const HOURS_PER_DAY = 24
const MINUTES_PER_HOUR = 60
const COMPACT_HOUR_HEIGHT = 48
const EXPANDED_HOUR_HEIGHT = 72
const MINUTES_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR
const MINUTES_PER_SLOT = 15

export type TimelineSelection = {
  dateKey: string
  endMinuteOfDay: number | null
  startMinuteOfDay: number
}

export const timelineHeight = (expanded: boolean): number => (
  HOURS_PER_DAY * (expanded ? EXPANDED_HOUR_HEIGHT : COMPACT_HOUR_HEIGHT)
)

export const timelineSlotFromOffset = (offset: number, height: number): number => {
  if (!Number.isFinite(offset) || !Number.isFinite(height) || height <= 0) return 0
  const slot = Math.round((Math.min(height, Math.max(0, offset)) / height) * (MINUTES_PER_DAY / MINUTES_PER_SLOT))
  return Math.min(MINUTES_PER_DAY, slot * MINUTES_PER_SLOT)
}

export const advanceTimelineSelection = (
  selection: TimelineSelection | null,
  dateKey: string,
  selectedMinute: number,
): TimelineSelection => {
  const selectedBoundary = Math.min(
    MINUTES_PER_DAY,
    Math.max(0, Math.round(selectedMinute / MINUTES_PER_SLOT) * MINUTES_PER_SLOT),
  )
  if (
    !selection
    || selection.dateKey !== dateKey
    || selection.endMinuteOfDay !== null
    || selectedBoundary <= selection.startMinuteOfDay
  ) {
    return {
      dateKey,
      endMinuteOfDay: null,
      startMinuteOfDay: Math.min(MINUTES_PER_DAY - MINUTES_PER_SLOT, selectedBoundary),
    }
  }
  return {
    dateKey,
    endMinuteOfDay: selectedBoundary,
    startMinuteOfDay: selection.startMinuteOfDay,
  }
}

const isTimedTask = <T extends TimelineTaskInput>(task: T): task is T & {
  endMinuteOfDay: number
  startMinuteOfDay: number
} => task.startMinuteOfDay !== null
  && task.endMinuteOfDay !== null
  && task.startMinuteOfDay >= 0
  && task.endMinuteOfDay > task.startMinuteOfDay
  && task.endMinuteOfDay <= MINUTES_PER_DAY

export const layoutTimedTasks = <T extends TimelineTaskInput>(
  tasks: readonly T[],
  expanded: boolean,
): PositionedTimelineTask<T>[] => {
  const pixelsPerMinute = timelineHeight(expanded) / MINUTES_PER_DAY
  const sorted = tasks.filter(isTimedTask).sort((left, right) => (
    left.startMinuteOfDay - right.startMinuteOfDay
    || left.endMinuteOfDay - right.endMinuteOfDay
    || left.id.localeCompare(right.id)
  ))
  const result: PositionedTimelineTask<T>[] = []

  for (let index = 0; index < sorted.length;) {
    const group: Array<T & { endMinuteOfDay: number; startMinuteOfDay: number }> = [sorted[index]!]
    let groupEnd = sorted[index]!.endMinuteOfDay
    let cursor = index + 1
    while (cursor < sorted.length && sorted[cursor]!.startMinuteOfDay < groupEnd) {
      group.push(sorted[cursor]!)
      groupEnd = Math.max(groupEnd, sorted[cursor]!.endMinuteOfDay)
      cursor += 1
    }

    const laneEnds: number[] = []
    const assigned = group.map((task) => {
      let lane = laneEnds.findIndex((end) => end <= task.startMinuteOfDay)
      if (lane === -1) lane = laneEnds.length
      laneEnds[lane] = task.endMinuteOfDay
      return { lane, task }
    })
    const laneCount = laneEnds.length
    for (const { lane, task } of assigned) {
      result.push({
        conflict: group.length > 1,
        height: (task.endMinuteOfDay - task.startMinuteOfDay) * pixelsPerMinute,
        lane,
        laneCount,
        task,
        top: task.startMinuteOfDay * pixelsPerMinute,
      })
    }
    index = cursor
  }

  return result
}

export const groupTasksByDate = <T extends Pick<TimelineTaskInput, 'scheduledFor'>>(
  tasks: readonly T[],
): Map<string, T[]> => {
  const grouped = new Map<string, T[]>()
  for (const task of tasks) {
    const key = task.scheduledFor.slice(0, 10)
    const day = grouped.get(key) ?? []
    day.push(task)
    grouped.set(key, day)
  }
  return grouped
}
