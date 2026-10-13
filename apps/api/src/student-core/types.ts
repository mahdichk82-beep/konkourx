export type DomainStudent = {
  id: string
  role: 'STUDENT' | 'COUNSELOR' | 'ADMIN'
  status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED'
}

import type { CurriculumTrackId } from '../curriculum/types.js'
import type { TaskContentType } from '../task-domain/validation.js'

export type StudentProfileRef = { id: string; userId: string; track?: CurriculumTrackId | null }
export type StudyPlanStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
import type {
  CurriculumSelectionV2Input,
  CurriculumTargetRecord,
  CurriculumTargetInput,
  TaskCurriculumCoverage,
} from '../task-curriculum/types.js'

export type DailyTaskStatus = 'PENDING' | 'COMPLETED' | 'PARTIAL' | 'SKIPPED'
export type DailyTaskSource = 'PERSONAL' | 'COUNSELOR'
export type DailyTaskSkipReason = 'NO_TIME' | 'TOO_DIFFICULT' | 'FORGOT' | 'OTHER'

export type DailyTaskDeadlineMissRecord = {
  id: string
  dailyTaskId?: string
  scheduledFor: Date
  deadlineAt: Date
  recordedAt: Date
}

export type DailyTaskDeadlineMissView = Omit<DailyTaskDeadlineMissRecord, 'dailyTaskId' | 'id'>

export type StudySubjectRecord = {
  id: string
  studentProfileId: string
  name: string
  normalizedName: string
  archivedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type TopicRecord = {
  id: string
  subjectId: string
  title: string
  normalizedTitle: string
  archivedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type StudyPlanRecord = {
  id: string
  studentProfileId: string
  title: string
  description: string | null
  status: StudyPlanStatus
  startsOn: Date
  endsOn: Date | null
  createdAt: Date
  updatedAt: Date
}

export type DailyTaskRecord = {
  id: string
  studentProfileId: string
  createdByUserId: string
  source: DailyTaskSource
  contentType?: TaskContentType | null
  studyPlanId: string | null
  subjectId: string | null
  topicId: string | null
  title: string
  description: string | null
  scheduledFor: Date
  startMinuteOfDay?: number | null
  endMinuteOfDay?: number | null
  estimatedMinutes: number | null
  plannedTestCount: number
  actualSolvedTestCount?: number
  deadlineEligibilityStartedAt?: Date
  deadlineMisses?: DailyTaskDeadlineMissRecord[]
  status: DailyTaskStatus
  completedAt: Date | null
  partialAt?: Date | null
  skipReason: DailyTaskSkipReason | null
  skippedAt: Date | null
  createdAt: Date
  updatedAt: Date
  curriculumTargets?: CurriculumTargetRecord[]
}

export type DailyTaskView = Omit<
  DailyTaskRecord,
  | 'createdByUserId'
  | 'curriculumTargets'
  | 'deadlineEligibilityStartedAt'
  | 'deadlineMisses'
  | 'startMinuteOfDay'
  | 'endMinuteOfDay'
> & {
  actualSolvedTestCount: number
  partialAt: Date | null
  startMinuteOfDay: number | null
  endMinuteOfDay: number | null
  miniBoxSpan: number | null
  curriculum: TaskCurriculumCoverage
  deadlineMisses: DailyTaskDeadlineMissView[]
}

export type StudentTaskCreateInput = {
  contentType?: TaskContentType
  studyPlanId: string | null
  subjectId: string | null
  topicId: string | null
  title: string
  description?: string | null
  scheduledFor: string
  startMinuteOfDay?: number | null
  endMinuteOfDay?: number | null
  estimatedMinutes: number | null
  status: DailyTaskStatus
  skipReason?: DailyTaskSkipReason | null
  curriculumTargets?: CurriculumTargetInput[]
  curriculumSelection?: CurriculumSelectionV2Input
}

export type RescheduleTaskInput = {
  scheduledFor?: string
  startMinuteOfDay?: number | null
  endMinuteOfDay?: number | null
}

export type TaskSchedulePatch = {
  scheduledFor?: Date
  startMinuteOfDay?: number | null
  endMinuteOfDay?: number | null
}

export type TaskProgressPatch = {
  actualSolvedTestCount: number
  expectedUpdatedAt: Date
}

export type UpdateTaskProgressResult =
  | { ok: true; value: DailyTaskRecord }
  | {
      ok: false
      reason:
        | 'TASK_NOT_FOUND'
        | 'TASK_PROGRESS_NOT_APPLICABLE'
        | 'TASK_TERMINAL'
        | 'TASK_PROGRESS_STALE'
    }

export type RescheduleStudentTaskResult =
  | { ok: true; value: DailyTaskRecord }
  | {
      ok: false
      reason: 'TASK_NOT_FOUND' | 'TASK_SOURCE_FORBIDDEN' | 'TASK_EXECUTED'
    }

export type UpdateTerminalStudentTaskResult =
  | { ok: true; value: DailyTaskRecord }
  | { ok: false; reason: 'TASK_NOT_FOUND' | 'ACTIVE_STUDY_SESSION_EXISTS' }

export type PageQuery = { cursor?: string; limit?: number }
export type Page<T> = { items: T[]; nextCursor: string | null }

export type OverdueTaskCursor = {
  createdAt: Date
  id: string
  scheduledFor: Date
}
