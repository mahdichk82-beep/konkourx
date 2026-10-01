import { z } from 'zod'
import {
  MINUTES_PER_DAY,
  validateTaskScheduleWindow,
  type TaskScheduleValidationError,
  type TaskScheduleWindow,
} from '../task-scheduling/schedule.js'

const minuteOfDay = z.number().int().min(0).max(MINUTES_PER_DAY)

export const defaultTaskScheduleFields = {
  startMinuteOfDay: minuteOfDay.nullable().optional().default(null),
  endMinuteOfDay: minuteOfDay.nullable().optional().default(null),
}

export const optionalTaskScheduleFields = {
  startMinuteOfDay: minuteOfDay.nullable().optional(),
  endMinuteOfDay: minuteOfDay.nullable().optional(),
}

const messages: Record<TaskScheduleValidationError, string> = {
  END_NOT_AFTER_START: 'End time must be after start time on the same day',
  END_OUT_OF_RANGE: 'End time must be between 00:15 and 24:00',
  NOT_ALIGNED: 'Task times must align to 15-minute boundaries',
  PAIR_REQUIRED: 'Start and end times must be provided together',
  START_OUT_OF_RANGE: 'Start time must be between 00:00 and 23:45',
}

export const refineTaskSchedule = (
  value: TaskScheduleWindow,
  context: z.RefinementCtx,
): void => {
  const error = validateTaskScheduleWindow(value)
  if (!error) return
  context.addIssue({
    code: 'custom',
    message: messages[error],
    path: error.startsWith('END_') ? ['endMinuteOfDay'] : ['startMinuteOfDay'],
  })
}
