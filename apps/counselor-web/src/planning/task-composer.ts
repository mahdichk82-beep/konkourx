import type { PlanningCurriculumValue } from '@konkourx/curriculum-browser'
import type {
  CreateCounselorBatchTaskInput,
  CreateCounselorTaskBatchResult,
} from '../students/student-tasks-client.ts'

export const durationPresets = [30, 45, 60, 90, 120] as const

export type ComposerTaskDraft = {
  contentType: 'STUDY' | 'GENERAL' | ''
  curriculum: PlanningCurriculumValue
  description: string
  durationMinutes: string
  id: string
  plannedMinutes: string
  plannedTestCount: string
  scheduleMode: 'VOLUMETRIC' | 'TIMED'
  scheduledFor: string
  startTime: string
  title: string
}

export type TimedWindow = {
  endMinuteOfDay: number
  endTime: string
  startMinuteOfDay: number
}

export type ComposerTimedPrefill = Pick<TimedWindow, 'endMinuteOfDay' | 'startMinuteOfDay'>

export const createComposerTask = (
  id: string,
  scheduledFor: string,
  timedPrefill?: ComposerTimedPrefill,
): ComposerTaskDraft => ({
  contentType: '',
  curriculum: {
    kind: 'V2',
    selection: { version: 2, selectors: [] },
    summaries: [],
  },
  description: '',
  durationMinutes: timedPrefill
    ? String(timedPrefill.endMinuteOfDay - timedPrefill.startMinuteOfDay)
    : '',
  id,
  plannedMinutes: '',
  plannedTestCount: '',
  scheduleMode: 'TIMED',
  scheduledFor,
  startTime: timedPrefill ? formatTime(timedPrefill.startMinuteOfDay) : '',
  title: '',
})

export const withComposerScheduleMode = (
  task: ComposerTaskDraft,
  scheduleMode: ComposerTaskDraft['scheduleMode'],
): ComposerTaskDraft => ({ ...task, scheduleMode })

const parseTime = (value: string): number | null => {
  const match = /^(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null
  const minuteOfDay = hours * 60 + minutes
  return minuteOfDay % 15 === 0 ? minuteOfDay : null
}

const formatTime = (minuteOfDay: number): string => {
  if (minuteOfDay === 1440) return '24:00'
  return `${String(Math.floor(minuteOfDay / 60)).padStart(2, '0')}:${String(minuteOfDay % 60).padStart(2, '0')}`
}

export const deriveTimedWindow = (
  startTime: string,
  durationMinutes: number,
): TimedWindow | null => {
  const startMinuteOfDay = parseTime(startTime)
  if (
    startMinuteOfDay === null
    || !Number.isSafeInteger(durationMinutes)
    || durationMinutes <= 0
    || durationMinutes % 15 !== 0
  ) return null
  const endMinuteOfDay = startMinuteOfDay + durationMinutes
  if (endMinuteOfDay > 1440) return null
  return { endMinuteOfDay, endTime: formatTime(endMinuteOfDay), startMinuteOfDay }
}

const validDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

const optionalInteger = (value: string, maximum?: number): boolean => {
  if (value === '') return true
  if (!/^\d+$/.test(value)) return false
  const number = Number(value)
  return Number.isSafeInteger(number)
    && number >= 0
    && (maximum === undefined || number <= maximum)
}

export const validateComposerTasks = (tasks: readonly ComposerTaskDraft[]): string | null => {
  if (tasks.length === 0) return 'حداقل یک تکلیف لازم است.'
  if (tasks.length > 50) return 'در هر بار حداکثر ۵۰ تکلیف قابل ثبت است.'

  for (const [index, task] of tasks.entries()) {
    const row = (index + 1).toLocaleString('fa-IR')
    if (!task.title.trim()) return `عنوان تکلیف ${row} الزامی است.`
    if (task.title.trim().length > 200) return `عنوان تکلیف ${row} بیش از حد طولانی است.`
    if (!validDate(task.scheduledFor)) return `تاریخ تکلیف ${row} معتبر نیست.`
    if (!task.contentType) return `نوع کار تکلیف ${row} را انتخاب کنید.`
    if (task.description.trim().length > 2000) return `توضیحات تکلیف ${row} بیش از حد طولانی است.`
    if (!optionalInteger(task.plannedMinutes, 1440)) {
      return `مدت برنامه‌ریزی‌شده تکلیف ${row} باید عدد صحیح بین صفر و ۱۴۴۰ باشد.`
    }
    if (!optionalInteger(task.plannedTestCount)) {
      return `تعداد تست تکلیف ${row} باید عدد صحیح نامنفی باشد.`
    }
    if (task.contentType === 'STUDY' && (
      task.curriculum.kind !== 'V2'
      || task.curriculum.selection.selectors.length === 0
    )) return `برای تکلیف درسی ${row} حداقل یک مبحث معتبر انتخاب کنید.`

    if (task.scheduleMode === 'TIMED') {
      const duration = Number(task.durationMinutes)
      if (!deriveTimedWindow(task.startTime, duration)) {
        return `زمان تکلیف ${row} باید ۱۵ دقیقه‌ای و در همان روز باشد.`
      }
    }
  }
  return null
}

export const toBatchInputs = (
  tasks: readonly ComposerTaskDraft[],
): CreateCounselorBatchTaskInput[] => tasks.map((task) => {
  const timedWindow = task.scheduleMode === 'TIMED'
    ? deriveTimedWindow(task.startTime, Number(task.durationMinutes))
    : null
  if (task.scheduleMode === 'TIMED' && !timedWindow) {
    throw new Error('Invalid timed task window')
  }

  return {
    contentType: task.contentType as 'STUDY' | 'GENERAL',
    ...(task.contentType === 'STUDY' && task.curriculum.kind === 'V2'
      ? { curriculumSelection: task.curriculum.selection }
      : {}),
    description: task.description.trim() || null,
    endMinuteOfDay: timedWindow?.endMinuteOfDay ?? null,
    plannedMinutes: timedWindow
      ? timedWindow.endMinuteOfDay - timedWindow.startMinuteOfDay
      : Number(task.plannedMinutes || 0),
    plannedTestCount: task.contentType === 'STUDY'
      ? Number(task.plannedTestCount || 0)
      : 0,
    scheduledFor: task.scheduledFor,
    startMinuteOfDay: timedWindow?.startMinuteOfDay ?? null,
    subjectId: null,
    title: task.title.trim(),
    topicId: null,
  }
})

export type ComposerSubmitResult =
  | { ok: true; value: CreateCounselorTaskBatchResult }
  | { error: unknown; ok: false }

export const submitComposerTasks = async (
  tasks: readonly ComposerTaskDraft[],
  request: (inputs: CreateCounselorBatchTaskInput[]) => Promise<CreateCounselorTaskBatchResult>,
): Promise<ComposerSubmitResult> => {
  const validationError = validateComposerTasks(tasks)
  if (validationError) return { error: new Error(validationError), ok: false }
  try {
    return { ok: true, value: await request(toBatchInputs(tasks)) }
  } catch (error) {
    return { error, ok: false }
  }
}
