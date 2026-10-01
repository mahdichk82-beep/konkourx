export type StudyTrackingActor = {
  id: string
  role: 'STUDENT' | 'COUNSELOR' | 'ADMIN'
  status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED'
}

export type StudentProfileRef = { id: string; userId: string }
export type StudySubjectRef = { id: string; studentProfileId: string; archivedAt: Date | null }
export type DailyTaskRef = {
  id: string
  studentProfileId: string
  subjectId: string | null
  status: 'PENDING' | 'COMPLETED' | 'PARTIAL' | 'SKIPPED'
}
export type StudentGoalStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED'

export type StudySessionRecord = {
  id: string
  studentProfileId: string
  subjectId: string | null
  dailyTaskId: string | null
  startedAt: Date
  endedAt: Date | null
  cancelledAt: Date | null
  focusRating: number | null
  studyQualityRating: number | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type StudySessionView = Omit<StudySessionRecord, 'studentProfileId'> & {
  durationMinutes: number | null
}

export type StartStudySessionResult =
  | { ok: true; value: StudySessionRecord; reused: boolean }
  | {
      ok: false
      reason:
        | 'TASK_NOT_FOUND'
        | 'TASK_NOT_EXECUTABLE'
        | 'SUBJECT_NOT_FOUND'
        | 'SUBJECT_ARCHIVED'
        | 'ACTIVE_STUDY_SESSION_EXISTS'
    }

export type CurrentSessionAction = 'FINISH' | 'CANCEL'

export type SwitchStudySessionResult =
  | {
      ok: true
      value: {
        finishedSession: StudySessionRecord | null
        cancelledSession: StudySessionRecord | null
        activeSession: StudySessionRecord
      }
    }
  | {
      ok: false
      reason:
        | 'TASK_NOT_FOUND'
        | 'TASK_NOT_EXECUTABLE'
        | 'SUBJECT_NOT_FOUND'
        | 'SUBJECT_ARCHIVED'
        | 'SESSION_TIME_INVALID'
        | 'LIVE_SESSION_CONFLICT'
    }

export type SwitchStudySessionView = {
  finishedSession: StudySessionView | null
  cancelledSession: StudySessionView | null
  activeSession: StudySessionView
}

export type FinishStudySessionResult =
  | { ok: true; value: StudySessionRecord }
  | { ok: false; reason: 'SESSION_NOT_FOUND' | 'SESSION_ALREADY_FINISHED' | 'SESSION_ALREADY_CANCELLED' | 'SESSION_TIME_INVALID' }

export type CancelStudySessionResult =
  | { ok: true; value: StudySessionRecord }
  | { ok: false; reason: 'SESSION_NOT_FOUND' | 'SESSION_ALREADY_FINISHED' | 'SESSION_ALREADY_CANCELLED' }

export type StudySessionFeedbackInput = {
  focusRating?: number | null
  studyQualityRating?: number | null
}

export type UpdateStudySessionFeedbackResult =
  | { ok: true; value: StudySessionRecord }
  | { ok: false; reason: 'SESSION_NOT_FOUND' | 'SESSION_NOT_FINISHED' | 'SESSION_ALREADY_CANCELLED' }

export type StudentGoalRecord = {
  id: string
  studentProfileId: string
  subjectId: string | null
  title: string
  description: string | null
  targetDate: Date | null
  status: StudentGoalStatus
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type TrackingPageQuery = { cursor?: string; limit?: number }
export type SessionListQuery = TrackingPageQuery & {
  dailyTaskId?: string
  from?: Date
  to?: Date
  subjectId?: string
}
export type GoalListQuery = TrackingPageQuery & { status?: StudentGoalStatus; subjectId?: string }
export type TrackingPage<T> = { items: T[]; nextCursor: string | null }
