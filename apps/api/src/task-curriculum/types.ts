export type CurriculumReferenceKind = 'NODE' | 'PLACEMENT'
export type CurriculumSelectionMode = 'EXACT' | 'WHOLE'

export type CurriculumTargetInput = {
  referenceKind: CurriculumReferenceKind
  curriculumRefId: string
  selectionMode: CurriculumSelectionMode
}

export type ResolvedCurriculumItem = {
  referenceKind: CurriculumReferenceKind
  curriculumRefId: string
  labelSnapshot: string
  pathSnapshot: string[]
  position: number
}

export type ResolvedCurriculumTarget = CurriculumTargetInput & {
  position: number
  labelSnapshot: string
  pathSnapshot: string[]
  representationIdSnapshot: string | null
  items: ResolvedCurriculumItem[]
}

export type CurriculumItemRecord = ResolvedCurriculumItem & {
  id: string
  targetId: string
  completedAt: Date | null
  createdAt: Date
}

export type CurriculumTargetRecord = Omit<ResolvedCurriculumTarget, 'items'> & {
  id: string
  createdAt: Date
  items: CurriculumItemRecord[]
}

export type TaskCurriculumCoverage = {
  targets: CurriculumTargetRecord[]
  completedItemCount: number
  totalItemCount: number
  remainingItemCount: number
}

export type ReplaceCurriculumTargetsResult =
  | { ok: true; value: import('../student-core/types.js').DailyTaskRecord }
  | {
      ok: false
      reason: 'TASK_NOT_FOUND' | 'TASK_SOURCE_FORBIDDEN' | 'TASK_NOT_PENDING' | 'CURRICULUM_EXECUTION_STARTED' | 'TASK_GENERAL_TARGET_FORBIDDEN' | 'TASK_STUDY_TARGET_REQUIRED'
    }

export type ToggleCurriculumItemResult =
  | { ok: true; value: import('../student-core/types.js').DailyTaskRecord }
  | { ok: false; reason: 'TASK_NOT_FOUND' | 'TASK_NOT_PENDING' | 'CURRICULUM_ITEM_NOT_FOUND' }

export const emptyTaskCurriculumCoverage = (): TaskCurriculumCoverage => ({
  targets: [],
  completedItemCount: 0,
  totalItemCount: 0,
  remainingItemCount: 0,
})

