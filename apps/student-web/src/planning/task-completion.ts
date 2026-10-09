export type CurriculumExecutionItem = {
  completedAt: string | null
  createdAt: string
  curriculumRefId: string
  id: string
  labelSnapshot: string
  pathSnapshot: readonly string[]
  position: number
  referenceKind: 'NODE' | 'PLACEMENT'
  targetId: string
}

export type CurriculumExecutionTarget = {
  items: readonly CurriculumExecutionItem[]
  position: number
}

export type CurriculumCoverageCounts = {
  completedItemCount: number
  remainingItemCount: number
  totalItemCount: number
}

export type TaskCompletionState = {
  canComplete: boolean
  explanation: string | null
}

export type CurriculumExecutionContext = {
  contentType: 'STUDY' | 'GENERAL' | null
  source: 'PERSONAL' | 'COUNSELOR'
  status: 'PENDING' | 'COMPLETED' | 'PARTIAL' | 'SKIPPED'
  totalItemCount: number
}

export const canToggleCurriculumExecutionItems = (
  context: CurriculumExecutionContext,
): boolean => context.status === 'PENDING'
  && context.contentType !== 'GENERAL'
  && context.totalItemCount > 0

export const curriculumExecutionItems = (
  targets: readonly CurriculumExecutionTarget[],
): CurriculumExecutionItem[] => [...targets]
  .sort((left, right) => left.position - right.position)
  .flatMap((target) => [...target.items].sort((left, right) => left.position - right.position))

export const taskCompletionState = (
  coverage: CurriculumCoverageCounts,
): TaskCompletionState => {
  if (coverage.totalItemCount === 0) return { canComplete: true, explanation: null }

  const canComplete = coverage.completedItemCount === coverage.totalItemCount
    && coverage.remainingItemCount === 0
  if (canComplete) return { canComplete: true, explanation: null }

  return {
    canComplete: false,
    explanation: `ابتدا مباحث تعیین‌شده را تکمیل کنید (${Math.max(coverage.remainingItemCount, 0).toLocaleString('fa-IR')} مورد باقی مانده).`,
  }
}

export const taskOutcomeErrorCodeMessage = (code: string): string | null => {
  if (code === 'TASK_OUTCOME_INVALID') {
    return 'وضعیت انتخاب‌شده با میزان تکمیل مباحث سازگار نیست. فهرست مباحث را تازه کنید و دوباره تلاش کنید.'
  }
  if (code === 'CURRICULUM_ITEM_NOT_FOUND') {
    return 'این مبحث دیگر در فهرست اجرای کار وجود ندارد. اطلاعات کار را تازه کنید.'
  }
  if (code === 'TASK_NOT_PENDING' || code === 'TASK_TERMINAL') {
    return 'این کار دیگر در انتظار نیست و مباحث آن قابل تغییر نیستند.'
  }
  return null
}

type AuthorizedRequest = <T>(path: string, init?: RequestInit) => Promise<T>

export const requestTaskCurriculumItemToggle = <T>(
  request: AuthorizedRequest,
  taskId: string,
  itemId: string,
  completed: boolean,
): Promise<T> => request<T>(
  `/student/daily-tasks/${encodeURIComponent(taskId)}/curriculum-items/${encodeURIComponent(itemId)}`,
  {
    body: JSON.stringify({ completed }),
    method: 'PATCH',
  },
)
