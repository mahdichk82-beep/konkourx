import type {
  CreateCounselorBatchTaskInput,
  CreateCounselorTaskBatchResult,
} from './student-tasks-client'
import type { PlanningCurriculumValue } from '@konkourx/curriculum-browser'
import {
  createScheduleDraft,
  prepareTaskSchedule,
  type TaskScheduleDraft,
} from './task-scheduling.ts'

export type BatchTaskRow = {
  contentType: 'STUDY' | 'GENERAL' | ''
  curriculum: PlanningCurriculumValue
  id: string
  title: string
  description: string
  scheduledFor: string
  plannedMinutes: string
  plannedTestCount: string
  schedule: TaskScheduleDraft
}

export type BatchSubmitResult =
  | { ok: true; value: CreateCounselorTaskBatchResult }
  | { ok: false; error: unknown }

const dateOnly = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

const nonNegativeInteger = (value: string, maximum?: number) => {
  if (!/^\d+$/.test(value)) return false
  const number = Number(value)
  return Number.isSafeInteger(number) && number >= 0 && (maximum === undefined || number <= maximum)
}

export const createBatchTaskRow = (id: string, scheduledFor: string): BatchTaskRow => ({
  contentType: '',
  curriculum: {
    kind: 'V2',
    selection: { version: 2, selectors: [] },
    summaries: [],
  },
  description: '',
  id,
  plannedMinutes: '0',
  plannedTestCount: '0',
  schedule: createScheduleDraft(),
  scheduledFor,
  title: '',
})

export const addBatchTaskRow = (
  rows: BatchTaskRow[],
  row: BatchTaskRow,
): BatchTaskRow[] => [...rows, row]

export const removeBatchTaskRow = (
  rows: BatchTaskRow[],
  id: string,
): BatchTaskRow[] => rows.length === 1 ? rows : rows.filter((row) => row.id !== id)

export const updateBatchTaskRowCurriculum = (
  rows: BatchTaskRow[],
  id: string,
  curriculum: PlanningCurriculumValue,
): BatchTaskRow[] => rows.map((row) => row.id === id ? { ...row, curriculum } : row)

export const validateBatchTaskRows = (rows: BatchTaskRow[]): string | null => {
  if (rows.length === 0) return 'حداقل یک ردیف وظیفه لازم است.'
  if (rows.length > 50) return 'در هر بار حداکثر ۵۰ وظیفه قابل ثبت است.'

  for (const [index, row] of rows.entries()) {
    const rowNumber = (index + 1).toLocaleString('fa-IR')
    if (!row.title.trim()) return `عنوان ردیف ${rowNumber} الزامی است.`
    if (row.title.trim().length > 200) return `عنوان ردیف ${rowNumber} بیش از حد طولانی است.`
    if (!dateOnly(row.scheduledFor)) return `تاریخ ردیف ${rowNumber} معتبر نیست.`
    const schedule = prepareTaskSchedule(row.schedule)
    if (!schedule.ok) return `زمان‌بندی ردیف ${rowNumber}: ${schedule.message}`
    if (!nonNegativeInteger(row.plannedMinutes, 1440)) {
      return `مدت تخمینی مطالعه ردیف ${rowNumber} باید عدد صحیح بین صفر و ۱۴۴۰ باشد.`
    }
    if (!nonNegativeInteger(row.plannedTestCount)) {
      return `تعداد تست ردیف ${rowNumber} باید عدد صحیح نامنفی باشد.`
    }
    if (row.description.trim().length > 2000) {
      return `توضیحات ردیف ${rowNumber} بیش از حد طولانی است.`
    }
    if (!row.contentType) return `نوع کار ردیف ${rowNumber} الزامی است.`
    if (row.contentType === 'STUDY' && (
      row.curriculum.kind !== 'V2'
      || row.curriculum.selection.selectors.length === 0
    )) {
      return `برای کار درسی ردیف ${rowNumber} حداقل یک مبحث معتبر انتخاب کنید.`
    }
  }
  return null
}

export const toBatchTaskInputs = (rows: BatchTaskRow[]): CreateCounselorBatchTaskInput[] =>
  rows.map((row) => {
    const schedule = prepareTaskSchedule(row.schedule)
    if (!schedule.ok) throw new Error(schedule.message)
    return {
    contentType: row.contentType as 'STUDY' | 'GENERAL',
    ...(row.contentType === 'STUDY' && row.curriculum.kind === 'V2'
      ? { curriculumSelection: row.curriculum.selection }
      : {}),
    description: row.description.trim() || null,
    endMinuteOfDay: schedule.value.endMinuteOfDay,
    plannedMinutes: Number(row.plannedMinutes),
    plannedTestCount: row.contentType === 'STUDY' ? Number(row.plannedTestCount) : 0,
    scheduledFor: row.scheduledFor,
    startMinuteOfDay: schedule.value.startMinuteOfDay,
    subjectId: null,
    title: row.title.trim(),
    topicId: null,
    }
  })

export const submitBatchTaskRows = async (
  rows: BatchTaskRow[],
  request: (tasks: CreateCounselorBatchTaskInput[]) => Promise<CreateCounselorTaskBatchResult>,
): Promise<BatchSubmitResult> => {
  const validationError = validateBatchTaskRows(rows)
  if (validationError) return { ok: false, error: new Error(validationError) }

  try {
    return { ok: true, value: await request(toBatchTaskInputs(rows)) }
  } catch (error) {
    return { ok: false, error }
  }
}
