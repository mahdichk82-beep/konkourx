import type {
  CreateCounselorBatchTaskInput,
  CreateCounselorTaskBatchResult,
} from './student-tasks-client'
import type { PlanningCurriculumTargetInput } from '@konkourx/curriculum-browser'

export type BatchTaskRow = {
  contentType: 'STUDY' | 'GENERAL' | ''
  curriculumTargets: PlanningCurriculumTargetInput[]
  id: string
  title: string
  description: string
  scheduledFor: string
  plannedMinutes: string
  plannedTestCount: string
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
  curriculumTargets: [],
  description: '',
  id,
  plannedMinutes: '0',
  plannedTestCount: '0',
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

export const validateBatchTaskRows = (rows: BatchTaskRow[]): string | null => {
  if (rows.length === 0) return 'حداقل یک ردیف وظیفه لازم است.'
  if (rows.length > 50) return 'در هر بار حداکثر ۵۰ وظیفه قابل ثبت است.'

  for (const [index, row] of rows.entries()) {
    const rowNumber = (index + 1).toLocaleString('fa-IR')
    if (!row.title.trim()) return `عنوان ردیف ${rowNumber} الزامی است.`
    if (row.title.trim().length > 200) return `عنوان ردیف ${rowNumber} بیش از حد طولانی است.`
    if (!dateOnly(row.scheduledFor)) return `تاریخ ردیف ${rowNumber} معتبر نیست.`
    if (!nonNegativeInteger(row.plannedMinutes, 1440)) {
      return `زمان برنامه‌ریزی‌شده ردیف ${rowNumber} باید عدد صحیح بین صفر و ۱۴۴۰ باشد.`
    }
    if (!nonNegativeInteger(row.plannedTestCount)) {
      return `تعداد تست ردیف ${rowNumber} باید عدد صحیح نامنفی باشد.`
    }
    if (row.description.trim().length > 2000) {
      return `توضیحات ردیف ${rowNumber} بیش از حد طولانی است.`
    }
    if (!row.contentType) return `نوع کار ردیف ${rowNumber} الزامی است.`
    if (row.contentType === 'STUDY' && (
      row.curriculumTargets.length === 0
      || row.curriculumTargets.some((target) => target.referenceKind !== 'NODE' || target.selectionMode !== 'EXACT')
    )) {
      return `برای کار درسی ردیف ${rowNumber} حداقل یک مبحث معتبر انتخاب کنید.`
    }
  }
  return null
}

export const toBatchTaskInputs = (rows: BatchTaskRow[]): CreateCounselorBatchTaskInput[] =>
  rows.map((row) => ({
    contentType: row.contentType as 'STUDY' | 'GENERAL',
    curriculumTargets: row.contentType === 'STUDY' ? row.curriculumTargets : [],
    description: row.description.trim() || null,
    plannedMinutes: Number(row.plannedMinutes),
    plannedTestCount: row.contentType === 'STUDY' ? Number(row.plannedTestCount) : 0,
    scheduledFor: row.scheduledFor,
    subjectId: null,
    title: row.title.trim(),
    topicId: null,
  }))

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
