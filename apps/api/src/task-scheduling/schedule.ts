export const MINUTES_PER_DAY = 24 * 60
export const MINUTES_PER_MINI_BOX = 15
export const MINI_BOXES_PER_DAY = MINUTES_PER_DAY / MINUTES_PER_MINI_BOX

export type TaskScheduleWindow = {
  startMinuteOfDay?: number | null
  endMinuteOfDay?: number | null
}

export type TaskScheduleValidationError =
  | 'PAIR_REQUIRED'
  | 'START_OUT_OF_RANGE'
  | 'END_OUT_OF_RANGE'
  | 'NOT_ALIGNED'
  | 'END_NOT_AFTER_START'

export const validateTaskScheduleWindow = (
  window: TaskScheduleWindow,
): TaskScheduleValidationError | null => {
  const hasStart = Object.prototype.hasOwnProperty.call(window, 'startMinuteOfDay')
  const hasEnd = Object.prototype.hasOwnProperty.call(window, 'endMinuteOfDay')
  if (hasStart !== hasEnd) return 'PAIR_REQUIRED'
  const start = window.startMinuteOfDay ?? null
  const end = window.endMinuteOfDay ?? null

  if (start === null && end === null) return null
  if (start === null || end === null) return 'PAIR_REQUIRED'
  if (!Number.isInteger(start) || start < 0 || start >= MINUTES_PER_DAY) {
    return 'START_OUT_OF_RANGE'
  }
  if (!Number.isInteger(end) || end <= 0 || end > MINUTES_PER_DAY) {
    return 'END_OUT_OF_RANGE'
  }
  if (start % MINUTES_PER_MINI_BOX !== 0 || end % MINUTES_PER_MINI_BOX !== 0) {
    return 'NOT_ALIGNED'
  }
  if (end <= start) return 'END_NOT_AFTER_START'
  return null
}

export const deriveMiniBoxSpan = (
  window: TaskScheduleWindow,
): number | null => {
  if (validateTaskScheduleWindow(window) !== null) return null
  const start = window.startMinuteOfDay ?? null
  const end = window.endMinuteOfDay ?? null
  return start === null || end === null
    ? null
    : (end - start) / MINUTES_PER_MINI_BOX
}
