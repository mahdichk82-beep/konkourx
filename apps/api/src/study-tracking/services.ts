import { ApiError } from '../errors/api-error.js'
import {
  calculateStudySessionActiveElapsedMs,
  deriveStudySessionTimerState,
} from './duration.js'
import type { StudyTrackingStore } from './store.js'
import type {
  GoalListQuery,
  CurrentSessionAction,
  SessionListQuery,
  StudentGoalRecord,
  StudySessionRecord,
  StudySessionFeedbackInput,
  StudySessionView,
  StudyTrackingActor,
  SwitchStudySessionView,
  TrackingPage,
  TrackingPageQuery,
} from './types.js'

const requireProfile = async (store: StudyTrackingStore, actor: StudyTrackingActor) => {
  if (actor.role !== 'STUDENT') throw new ApiError(403, 'ROLE_FORBIDDEN', 'Student access is required')
  if (actor.status !== 'ACTIVE') throw new ApiError(403, 'ACCOUNT_INACTIVE', 'Account is inactive')
  const profile = await store.findStudentProfileByUserId(actor.id)
  if (!profile) throw new ApiError(409, 'STUDENT_PROFILE_REQUIRED', 'Student profile is required')
  return profile
}

const page = <T extends { id: string }>(items: T[], query: TrackingPageQuery = {}): TrackingPage<T> => {
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 100)
  const start = query.cursor ? Math.max(items.findIndex((item) => item.id === query.cursor) + 1, 0) : 0
  const selected = items.slice(start, start + limit)
  return { items: selected, nextCursor: items.length > start + limit ? selected.at(-1)?.id ?? null : null }
}

const parseDateTime = (value: string): Date => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) throw new ApiError(400, 'SESSION_TIME_INVALID', 'Study session timestamp is invalid')
  return parsed
}

const parseGoalDate = (value: string): Date => {
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new ApiError(400, 'GOAL_DATE_INVALID', 'Goal target date is invalid')
  }
  return parsed
}

const toSessionView = (record: StudySessionRecord, serverNow: Date): StudySessionView => {
  const {
    pauses: _pauses,
    studentProfileId: _studentProfileId,
    ...safeRecord
  } = record
  const timerState = deriveStudySessionTimerState(record)
  const activeElapsedMs = calculateStudySessionActiveElapsedMs(record, serverNow)
  const currentPause = timerState === 'PAUSED'
    ? record.pauses?.find((pause) => pause.resumedAt === null) ?? null
    : null
  return {
    ...safeRecord,
    focusRating: record.focusRating ?? null,
    isTimerManaged: record.isTimerManaged ?? false,
    studyQualityRating: record.studyQualityRating ?? null,
    durationMinutes: record.endedAt && !record.cancelledAt
      ? Math.round(activeElapsedMs / 60_000)
      : null,
    activeElapsedMs,
    pausedAt: currentPause?.pausedAt ?? null,
    serverNow,
    timerState,
  }
}

const throwTimerTransitionFailure = (reason:
  | 'SESSION_NOT_FOUND'
  | 'SESSION_ALREADY_FINISHED'
  | 'SESSION_ALREADY_CANCELLED'
  | 'SESSION_NOT_PAUSED'
  | 'SESSION_STATE_STALE'
): never => {
  switch (reason) {
    case 'SESSION_NOT_FOUND':
      throw new ApiError(404, reason, 'Study session not found')
    case 'SESSION_ALREADY_FINISHED':
      throw new ApiError(409, reason, 'Study session is already finished')
    case 'SESSION_ALREADY_CANCELLED':
      throw new ApiError(409, reason, 'Study session is already cancelled')
    case 'SESSION_NOT_PAUSED':
      throw new ApiError(409, reason, 'Study session is not paused')
    case 'SESSION_STATE_STALE':
      throw new ApiError(409, reason, 'Study session state changed concurrently')
  }
}

const conflict = (error: unknown, code: string, message: string): never => {
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') throw new ApiError(409, code, message)
  throw error
}

const liveOperation = async <T>(operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation()
  } catch (error) {
    if (
      typeof error === 'object'
      && error !== null
      && 'code' in error
      && (error.code === 'P2002' || error.code === 'P2034' || error.code === '40P01')
    ) {
      throw new ApiError(409, 'LIVE_SESSION_CONFLICT', 'Live study state changed concurrently')
    }
    throw error
  }
}

const throwLiveTaskFailure = (reason:
  | 'TASK_NOT_FOUND'
  | 'TASK_NOT_EXECUTABLE'
  | 'SUBJECT_NOT_FOUND'
  | 'SUBJECT_ARCHIVED'
  | 'ACTIVE_STUDY_SESSION_EXISTS'
  | 'SESSION_TIME_INVALID'
  | 'LIVE_SESSION_CONFLICT'
): never => {
  switch (reason) {
    case 'TASK_NOT_FOUND':
      throw new ApiError(404, 'TASK_NOT_FOUND', 'Daily task not found')
    case 'TASK_NOT_EXECUTABLE':
      throw new ApiError(409, 'TASK_NOT_EXECUTABLE', 'Only pending tasks can be started')
    case 'SUBJECT_NOT_FOUND':
      throw new ApiError(404, 'SUBJECT_NOT_FOUND', 'Study subject not found')
    case 'SUBJECT_ARCHIVED':
      throw new ApiError(409, 'SUBJECT_ARCHIVED', 'Archived subjects cannot be used for new sessions')
    case 'ACTIVE_STUDY_SESSION_EXISTS':
      throw new ApiError(409, 'ACTIVE_STUDY_SESSION_EXISTS', 'Another study session is active')
    case 'SESSION_TIME_INVALID':
      throw new ApiError(400, 'SESSION_TIME_INVALID', 'Study session must end after it starts')
    case 'LIVE_SESSION_CONFLICT':
      throw new ApiError(409, 'LIVE_SESSION_CONFLICT', 'Live study state changed concurrently')
  }
}

type CreateSessionInput = {
  dailyTaskId: string | null
  endedAt: string
  focusRating?: number | null
  notes?: string | null
  startedAt: string
  studyQualityRating?: number | null
  subjectId: string | null
}

const createSession = async (
  store: StudyTrackingStore,
  profileId: string,
  input: CreateSessionInput,
  serverNow: Date,
): Promise<StudySessionView> => {
  const startedAt = parseDateTime(input.startedAt)
  const endedAt = parseDateTime(input.endedAt)
  if (endedAt <= startedAt) {
    throw new ApiError(400, 'SESSION_TIME_INVALID', 'Study session must end after it starts')
  }
  try {
    const record = await store.createSession({
      cancelledAt: null,
      dailyTaskId: input.dailyTaskId,
      endedAt,
      focusRating: input.focusRating ?? null,
      notes: input.notes ?? null,
      startedAt,
      studyQualityRating: input.studyQualityRating ?? null,
      studentProfileId: profileId,
      subjectId: input.subjectId,
    })
    return toSessionView(record, serverNow)
  } catch (error) {
    return conflict(error, 'SESSION_CONFLICT', 'Study session could not be created')
  }
}

export const createStudyTrackingServices = (store: StudyTrackingStore, now = () => new Date()) => {
  const sessions = {
    async list(actor: StudyTrackingActor, query?: SessionListQuery): Promise<TrackingPage<StudySessionView>> {
      const profile = await requireProfile(store, actor)
      if (query?.dailyTaskId && !await store.findTaskById(profile.id, query.dailyTaskId)) {
        throw new ApiError(404, 'TASK_NOT_FOUND', 'Daily task not found')
      }
      const records = await store.listSessions(profile.id, query)
      const serverNow = now()
      return page(records.map((record) => toSessionView(record, serverNow)), query)
    },
    async active(actor: StudyTrackingActor): Promise<StudySessionView | null> {
      const profile = await requireProfile(store, actor)
      const record = await store.findActiveSession(profile.id)
      return record ? toSessionView(record, now()) : null
    },
    async get(actor: StudyTrackingActor, id: string): Promise<StudySessionView> {
      const profile = await requireProfile(store, actor)
      const record = await store.findSessionById(profile.id, id)
      if (!record) throw new ApiError(404, 'SESSION_NOT_FOUND', 'Study session not found')
      return toSessionView(record, now())
    },
    async create(actor: StudyTrackingActor, input: { subjectId: string; dailyTaskId?: string | null; startedAt: string; endedAt: string; focusRating?: number | null; notes?: string | null; studyQualityRating?: number | null }): Promise<StudySessionView> {
      const profile = await requireProfile(store, actor)
      const subject = await store.findSubjectById(profile.id, input.subjectId)
      if (!subject) throw new ApiError(404, 'SUBJECT_NOT_FOUND', 'Study subject not found')
      if (subject.archivedAt) throw new ApiError(409, 'SUBJECT_ARCHIVED', 'Archived subjects cannot be used for new sessions')
      const dailyTaskId = input.dailyTaskId ?? null
      if (dailyTaskId) {
        const task = await store.findTaskById(profile.id, dailyTaskId)
        if (!task) throw new ApiError(404, 'TASK_NOT_FOUND', 'Daily task not found')
        if (task.subjectId && task.subjectId !== input.subjectId) throw new ApiError(400, 'TASK_SUBJECT_MISMATCH', 'Task subject does not match session subject')
      }
      return createSession(store, profile.id, { ...input, dailyTaskId }, now())
    },
    async createForTask(
      actor: StudyTrackingActor,
      taskId: string,
      input: { startedAt: string; endedAt: string; focusRating?: number | null; notes?: string | null; studyQualityRating?: number | null },
    ): Promise<StudySessionView> {
      const profile = await requireProfile(store, actor)
      const task = await store.findTaskById(profile.id, taskId)
      if (!task) throw new ApiError(404, 'TASK_NOT_FOUND', 'Daily task not found')
      if (task.subjectId) {
        const subject = await store.findSubjectById(profile.id, task.subjectId)
        if (!subject) throw new ApiError(404, 'SUBJECT_NOT_FOUND', 'Study subject not found')
        if (subject.archivedAt) {
          throw new ApiError(409, 'SUBJECT_ARCHIVED', 'Archived subjects cannot be used for new sessions')
        }
      }
      return createSession(store, profile.id, {
        ...input,
        dailyTaskId: task.id,
        subjectId: task.subjectId,
      }, now())
    },
    async startTask(actor: StudyTrackingActor, taskId: string): Promise<StudySessionView> {
      const profile = await requireProfile(store, actor)
      const serverNow = now()
      const result = await liveOperation(() =>
        store.startTaskSession(profile.id, taskId, serverNow))
      if (!result.ok) return throwLiveTaskFailure(result.reason)
      return toSessionView(result.value, serverNow)
    },
    async switchTask(
      actor: StudyTrackingActor,
      taskId: string,
      currentSessionAction: CurrentSessionAction = 'FINISH',
    ): Promise<SwitchStudySessionView> {
      const profile = await requireProfile(store, actor)
      const serverNow = now()
      const result = await liveOperation(() =>
        store.switchTaskSession(profile.id, taskId, serverNow, currentSessionAction))
      if (!result.ok) return throwLiveTaskFailure(result.reason)
      return {
        activeSession: toSessionView(result.value.activeSession, serverNow),
        cancelledSession: result.value.cancelledSession
          ? toSessionView(result.value.cancelledSession, serverNow)
          : null,
        finishedSession: result.value.finishedSession
          ? toSessionView(result.value.finishedSession, serverNow)
          : null,
      }
    },
    async finish(
      actor: StudyTrackingActor,
      id: string,
      input: StudySessionFeedbackInput & { notes?: string | null },
    ): Promise<StudySessionView> {
      const profile = await requireProfile(store, actor)
      const serverNow = now()
      const result = await liveOperation(() =>
        store.finishSession(profile.id, id, serverNow, input))
      if (!result.ok) {
        if (result.reason === 'SESSION_NOT_FOUND') {
          throw new ApiError(404, 'SESSION_NOT_FOUND', 'Study session not found')
        }
        if (result.reason === 'SESSION_ALREADY_FINISHED') {
          throw new ApiError(409, 'SESSION_ALREADY_FINISHED', 'Study session is already finished')
        }
        if (result.reason === 'SESSION_ALREADY_CANCELLED') {
          throw new ApiError(409, 'SESSION_ALREADY_CANCELLED', 'Study session is already cancelled')
        }
        if (result.reason === 'SESSION_STATE_STALE') {
          throw new ApiError(409, 'SESSION_STATE_STALE', 'Study session state changed concurrently')
        }
        throw new ApiError(400, 'SESSION_TIME_INVALID', 'Study session must end after it starts')
      }
      return toSessionView(result.value, serverNow)
    },
    async pause(
      actor: StudyTrackingActor,
      id: string,
      input: { expectedUpdatedAt: string },
    ): Promise<StudySessionView> {
      const profile = await requireProfile(store, actor)
      const serverNow = now()
      const result = await liveOperation(() => store.pauseSession(
        profile.id,
        id,
        serverNow,
        parseDateTime(input.expectedUpdatedAt),
      ))
      if (!result.ok) return throwTimerTransitionFailure(result.reason)
      return toSessionView(result.value, serverNow)
    },
    async resume(
      actor: StudyTrackingActor,
      id: string,
      input: { expectedUpdatedAt: string },
    ): Promise<StudySessionView> {
      const profile = await requireProfile(store, actor)
      const serverNow = now()
      const result = await liveOperation(() => store.resumeSession(
        profile.id,
        id,
        serverNow,
        parseDateTime(input.expectedUpdatedAt),
      ))
      if (!result.ok) return throwTimerTransitionFailure(result.reason)
      return toSessionView(result.value, serverNow)
    },
    async updateFeedback(
      actor: StudyTrackingActor,
      id: string,
      input: StudySessionFeedbackInput,
    ): Promise<StudySessionView> {
      const profile = await requireProfile(store, actor)
      const result = await store.updateSessionFeedback(profile.id, id, input)
      if (!result.ok) {
        if (result.reason === 'SESSION_NOT_FOUND') {
          throw new ApiError(404, 'SESSION_NOT_FOUND', 'Study session not found')
        }
        if (result.reason === 'SESSION_ALREADY_CANCELLED') {
          throw new ApiError(409, 'SESSION_ALREADY_CANCELLED', 'Study session is already cancelled')
        }
        throw new ApiError(409, 'SESSION_NOT_FINISHED', 'Feedback belongs only to finished study sessions')
      }
      return toSessionView(result.value, now())
    },
    async cancel(actor: StudyTrackingActor, id: string): Promise<StudySessionView> {
      const profile = await requireProfile(store, actor)
      const serverNow = now()
      const result = await liveOperation(() =>
        store.cancelSession(profile.id, id, serverNow))
      if (!result.ok) {
        if (result.reason === 'SESSION_NOT_FOUND') {
          throw new ApiError(404, 'SESSION_NOT_FOUND', 'Study session not found')
        }
        if (result.reason === 'SESSION_ALREADY_FINISHED') {
          throw new ApiError(409, 'SESSION_ALREADY_FINISHED', 'Study session is already finished')
        }
        throw new ApiError(409, 'SESSION_ALREADY_CANCELLED', 'Study session is already cancelled')
      }
      return toSessionView(result.value, serverNow)
    },
    async update(actor: StudyTrackingActor, id: string, input: { subjectId?: string; dailyTaskId?: string | null; startedAt?: string; endedAt?: string; notes?: string | null }): Promise<StudySessionView> {
      const profile = await requireProfile(store, actor)
      const current = await store.findSessionById(profile.id, id)
      if (!current) throw new ApiError(404, 'SESSION_NOT_FOUND', 'Study session not found')
      if (current.cancelledAt !== null) {
        throw new ApiError(409, 'SESSION_CANCELLED_UPDATE_FORBIDDEN', 'Cancelled sessions cannot be edited')
      }
      if (current.endedAt === null) {
        throw new ApiError(409, 'SESSION_ACTIVE_UPDATE_FORBIDDEN', 'Active sessions must use the finish operation')
      }
      if (current.isTimerManaged === true) {
        throw new ApiError(409, 'SESSION_TIMER_MANAGED_UPDATE_FORBIDDEN', 'Finished timer sessions are immutable')
      }
      const subjectId = input.subjectId ?? current.subjectId
      if (subjectId) {
        const subject = await store.findSubjectById(profile.id, subjectId)
        if (!subject) throw new ApiError(404, 'SUBJECT_NOT_FOUND', 'Study subject not found')
        if (subject.archivedAt) throw new ApiError(409, 'SUBJECT_ARCHIVED', 'Archived subjects cannot be used for sessions')
      }
      const dailyTaskId = input.dailyTaskId === undefined ? current.dailyTaskId : input.dailyTaskId
      if (dailyTaskId) {
        const task = await store.findTaskById(profile.id, dailyTaskId)
        if (!task) throw new ApiError(404, 'TASK_NOT_FOUND', 'Daily task not found')
        if (task.subjectId && task.subjectId !== subjectId) throw new ApiError(400, 'TASK_SUBJECT_MISMATCH', 'Task subject does not match session subject')
      }
      const startedAt = input.startedAt === undefined ? current.startedAt : parseDateTime(input.startedAt)
      const endedAt = input.endedAt === undefined ? current.endedAt : parseDateTime(input.endedAt)
      if (endedAt && endedAt <= startedAt) throw new ApiError(400, 'SESSION_TIME_INVALID', 'Study session must end after it starts')
      const record = await store.updateSession(profile.id, id, {
        ...(input.subjectId === undefined ? {} : { subjectId }),
        ...(input.dailyTaskId === undefined ? {} : { dailyTaskId }),
        ...(input.startedAt === undefined ? {} : { startedAt }),
        ...(input.endedAt === undefined ? {} : { endedAt }),
        ...(input.notes === undefined ? {} : { notes: input.notes }),
      })
      if (!record) throw new ApiError(404, 'SESSION_NOT_FOUND', 'Study session not found')
      return toSessionView(record, now())
    },
  }

  const goals = {
    async list(actor: StudyTrackingActor, query?: GoalListQuery): Promise<TrackingPage<StudentGoalRecord>> {
      const profile = await requireProfile(store, actor)
      return page(await store.listGoals(profile.id, query), query)
    },
    async get(actor: StudyTrackingActor, id: string): Promise<StudentGoalRecord> {
      const profile = await requireProfile(store, actor)
      const record = await store.findGoalById(profile.id, id)
      if (!record) throw new ApiError(404, 'GOAL_NOT_FOUND', 'Student goal not found')
      return record
    },
    async create(actor: StudyTrackingActor, input: { subjectId?: string | null; title: string; description?: string | null; targetDate?: string | null }): Promise<StudentGoalRecord> {
      const profile = await requireProfile(store, actor)
      const subjectId = input.subjectId ?? null
      if (subjectId) {
        const subject = await store.findSubjectById(profile.id, subjectId)
        if (!subject) throw new ApiError(404, 'SUBJECT_NOT_FOUND', 'Study subject not found')
        if (subject.archivedAt) throw new ApiError(409, 'SUBJECT_ARCHIVED', 'Archived subjects cannot be used for new goals')
      }
      const targetDate = input.targetDate ? parseGoalDate(input.targetDate) : null
      return store.createGoal({ studentProfileId: profile.id, subjectId, title: input.title.trim(), description: input.description ?? null, targetDate, status: 'ACTIVE', completedAt: null })
    },
    async update(actor: StudyTrackingActor, id: string, input: { subjectId?: string | null; title?: string; description?: string | null; targetDate?: string | null; status?: StudentGoalRecord['status'] }): Promise<StudentGoalRecord> {
      const profile = await requireProfile(store, actor)
      const current = await store.findGoalById(profile.id, id)
      if (!current) throw new ApiError(404, 'GOAL_NOT_FOUND', 'Student goal not found')
      if (input.subjectId) {
        const subject = await store.findSubjectById(profile.id, input.subjectId)
        if (!subject) throw new ApiError(404, 'SUBJECT_NOT_FOUND', 'Study subject not found')
        if (subject.archivedAt) throw new ApiError(409, 'SUBJECT_ARCHIVED', 'Archived subjects cannot be used for goals')
      }
      const targetDate = input.targetDate === undefined ? current.targetDate : input.targetDate === null ? null : parseGoalDate(input.targetDate)
      const status = input.status ?? current.status
      const record = await store.updateGoal(profile.id, id, {
        ...(input.subjectId === undefined ? {} : { subjectId: input.subjectId }),
        ...(input.title === undefined ? {} : { title: input.title.trim() }),
        ...(input.description === undefined ? {} : { description: input.description }),
        ...(input.targetDate === undefined ? {} : { targetDate }),
        ...(input.status === undefined ? {} : { status, completedAt: status === 'COMPLETED' ? now() : null }),
      })
      if (!record) throw new ApiError(404, 'GOAL_NOT_FOUND', 'Student goal not found')
      return record
    },
  }

  return { sessions, goals }
}

export type StudyTrackingServices = ReturnType<typeof createStudyTrackingServices>
export type { StudyTrackingStore } from './store.js'
