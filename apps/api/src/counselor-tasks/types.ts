import type {
  DailyTaskRecord,
  DailyTaskView,
} from '../student-core/types.js'
import type {
  CurriculumSelectionV2Input,
  CurriculumTargetInput,
  ResolvedCurriculumTarget,
} from '../task-curriculum/types.js'
import type { TaskSchedulePatch } from '../student-core/types.js'
import type { TaskContentType } from '../task-domain/validation.js'
import type { CurriculumTrackId } from '../curriculum/types.js'

export type CounselorTaskActor = {
  id: string
  role: 'STUDENT' | 'COUNSELOR' | 'ADMIN'
  status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED'
}

export type CounselorStudentSubject = {
  id: string
  name: string
}

export type CounselorStudentTopic = {
  id: string
  subjectId: string
  title: string
}

export type CounselorTaskPageQuery = {
  cursor?: string
  limit?: number
}

export type CounselorTaskListQuery = CounselorTaskPageQuery & {
  scheduledFrom?: string
  scheduledTo?: string
}

export type CounselorTaskStoreQuery = CounselorTaskPageQuery & {
  scheduledFrom?: Date
  scheduledTo?: Date
}

export type CounselorTaskPage<T> = {
  items: T[]
  nextCursor: string | null
}

export type CreateCounselorTaskInput = {
  contentType?: TaskContentType
  title: string
  description?: string | null
  scheduledFor: string
  startMinuteOfDay?: number | null
  endMinuteOfDay?: number | null
  estimatedMinutes: number | null
  subjectId: string | null
  topicId: string | null
  curriculumTargets?: CurriculumTargetInput[]
  curriculumSelection?: CurriculumSelectionV2Input
}

export type CreateCounselorTaskBatchItemInput = {
  contentType?: TaskContentType
  title: string
  description: string | null
  scheduledFor: string
  startMinuteOfDay?: number | null
  endMinuteOfDay?: number | null
  plannedMinutes: number
  plannedTestCount: number
  subjectId: string | null
  topicId: string | null
  curriculumTargets?: CurriculumTargetInput[]
  curriculumSelection?: CurriculumSelectionV2Input
}

export type CreateCounselorTaskBatchView = {
  created: number
  tasks: CounselorTaskView[]
}

export type CreateCounselorTaskRecordInput = Omit<
  DailyTaskRecord,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'curriculumTargets'
  | 'deadlineEligibilityStartedAt'
  | 'deadlineMisses'
>

export type CounselorTaskCreatePlan = {
  task: CreateCounselorTaskRecordInput
  curriculumTargets: ResolvedCurriculumTarget[]
}

export type UpdateCounselorTaskInput = {
  title?: string
  description?: string | null
  estimatedMinutes?: number | null
  scheduledFor?: string
  startMinuteOfDay?: number | null
  endMinuteOfDay?: number | null
}

export type CounselorTaskPlanningPatch = TaskSchedulePatch & {
  title?: string
  description?: string | null
  estimatedMinutes?: number | null
}

export type AssignedResourceResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: 'STUDENT_NOT_FOUND' }

export type AssignedStudentTrackResult = AssignedResourceResult<CurriculumTrackId | null>

export type CounselorVisibleTaskRecord = Omit<DailyTaskRecord, 'createdByUserId'> & {
  completedStudySessionCount: number
  hasActiveStudySession: boolean
  hasValidAssessmentAttempt: boolean
  recordedMinutes: number
  studySessionCount: number
}

export type AssignedTaskResult = AssignedResourceResult<CounselorVisibleTaskRecord[]>

export type AssignedTopicResult =
  | AssignedResourceResult<CounselorStudentTopic[]>
  | { ok: false; reason: 'SUBJECT_NOT_FOUND' }

export type CreateCounselorTaskResult =
  | { ok: true; value: DailyTaskRecord }
  | {
      ok: false
      reason:
        | 'STUDENT_NOT_FOUND'
        | 'SUBJECT_NOT_FOUND'
        | 'SUBJECT_ARCHIVED'
        | 'TOPIC_SUBJECT_REQUIRED'
        | 'TOPIC_NOT_FOUND'
        | 'TOPIC_SUBJECT_MISMATCH'
        | 'TOPIC_ARCHIVED'
    }

export type CreateCounselorTaskBatchResult =
  | { ok: true; value: DailyTaskRecord[] }
  | {
      ok: false
      reason:
        | 'COUNSELOR_PROFILE_NOT_FOUND'
        | 'STUDENT_NOT_FOUND'
        | 'SUBJECT_NOT_FOUND'
        | 'SUBJECT_ARCHIVED'
        | 'TOPIC_SUBJECT_REQUIRED'
        | 'TOPIC_NOT_FOUND'
        | 'TOPIC_SUBJECT_MISMATCH'
        | 'TOPIC_ARCHIVED'
    }

export type RescheduleCounselorTaskResult =
  | { ok: true; value: DailyTaskRecord }
  | {
      ok: false
      reason:
        | 'STUDENT_NOT_FOUND'
        | 'TASK_NOT_FOUND'
        | 'TASK_SOURCE_FORBIDDEN'
        | 'TASK_EXECUTED'
    }

export type UpdateCounselorTaskResult = RescheduleCounselorTaskResult

export type CounselorTaskView = DailyTaskView

export type CounselorVisibleTaskView = CounselorTaskView & {
  completedStudySessionCount: number
  hasActiveStudySession: boolean
  hasValidAssessmentAttempt: boolean
  recordedMinutes: number
  studySessionCount: number
}
