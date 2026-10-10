import type { DailyTaskStatus } from './planning-client'

export type SolvedTestProgressInput = {
  actualSolvedTestCount: number
  expectedUpdatedAt: string
}

export type SolvedTestProgressDraft = {
  count: string
  expectedUpdatedAt: string
}

const POSTGRES_INTEGER_MAX = 2_147_483_647

export type PreparedSolvedTestProgress =
  | { ok: true; value: SolvedTestProgressInput }
  | { ok: false; message: string }

export const prepareSolvedTestProgress = (
  rawCount: string,
  expectedUpdatedAt: string,
): PreparedSolvedTestProgress => {
  const actualSolvedTestCount = Number(rawCount)
  if (
    rawCount.trim() === ''
    || !Number.isSafeInteger(actualSolvedTestCount)
    || actualSolvedTestCount < 0
    || actualSolvedTestCount > POSTGRES_INTEGER_MAX
  ) {
    return {
      ok: false,
      message: 'تعداد تست حل‌شده باید یک عدد صحیح و نامنفی باشد.',
    }
  }
  return {
    ok: true,
    value: { actualSolvedTestCount, expectedUpdatedAt },
  }
}

export const progressDraftForTask = (
  existing: SolvedTestProgressDraft | undefined,
  actualSolvedTestCount: number,
  updatedAt: string,
): SolvedTestProgressDraft => existing ?? {
  count: String(actualSolvedTestCount),
  expectedUpdatedAt: updatedAt,
}

export const shouldShowOverdueGroup = (
  loadedTaskCount: number,
  nextCursor: string | null,
): boolean => loadedTaskCount > 0 || nextCursor !== null

export const canRecordSolvedTestProgress = (
  contentType: 'STUDY' | 'GENERAL' | null,
  status: DailyTaskStatus,
): boolean => contentType === 'STUDY' && status === 'PENDING'

export const studySessionPanelMode = (
  contentType: 'STUDY' | 'GENERAL' | null,
): 'INTERACTIVE' | 'READ_ONLY' | 'HIDDEN' => {
  if (contentType === 'STUDY') return 'INTERACTIVE'
  return contentType === null ? 'READ_ONLY' : 'HIDDEN'
}

export const toggleExpandedTask = (
  currentTaskId: string | null,
  taskId: string,
): string | null => currentTaskId === taskId ? null : taskId
