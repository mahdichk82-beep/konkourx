import { authClient } from '../auth/auth-client'
import type {
  CurriculumSelectionV2,
  PlanningCurriculumTargetSnapshot,
} from '@konkourx/curriculum-browser'
import {
  requestTaskCurriculumItemToggle,
  type CurriculumExecutionItem,
} from './task-completion'

export type DailyTaskStatus = 'PENDING' | 'COMPLETED' | 'PARTIAL' | 'SKIPPED'
export type DailyTaskSource = 'PERSONAL' | 'COUNSELOR'
export type DailyTaskSkipReason = 'NO_TIME' | 'TOO_DIFFICULT' | 'FORGOT' | 'OTHER'

export type StudySubject = {
  archivedAt: string | null
  id: string
  name: string
}

export type StudyTopic = {
  archivedAt: string | null
  id: string
  subjectId: string
  title: string
}

export type DailyTaskCurriculumTarget = PlanningCurriculumTargetSnapshot & {
  createdAt: string
  id: string
  items: CurriculumExecutionItem[]
}

export type DailyTask = {
  contentType: 'STUDY' | 'GENERAL' | null
  completedAt: string | null
  createdAt: string
  curriculum: {
    completedItemCount: number
    remainingItemCount: number
    targets: DailyTaskCurriculumTarget[]
    totalItemCount: number
  }
  description: string | null
  endMinuteOfDay: number | null
  estimatedMinutes: number | null
  id: string
  plannedTestCount: number
  scheduledFor: string
  skipReason: DailyTaskSkipReason | null
  skippedAt: string | null
  source: DailyTaskSource
  startMinuteOfDay: number | null
  status: DailyTaskStatus
  subjectId: string | null
  topicId: string | null
  title: string
  updatedAt: string
}

export type StudySession = {
  activeElapsedMs: number
  cancelledAt: string | null
  createdAt: string
  dailyTaskId: string | null
  durationMinutes: number | null
  endedAt: string | null
  focusRating: number | null
  id: string
  isTimerManaged: boolean
  notes: string | null
  pausedAt: string | null
  serverNow: string
  startedAt: string
  studyQualityRating: number | null
  subjectId: string | null
  timerState: 'RUNNING' | 'PAUSED' | 'FINISHED' | 'CANCELLED'
  updatedAt: string
}

export type SwitchStudySessionResult = {
  activeSession: StudySession
  cancelledSession: StudySession | null
  finishedSession: StudySession | null
}

export type CurrentSessionAction = 'FINISH' | 'CANCEL'

type Page<T> = {
  items: T[]
  nextCursor: string | null
}

export type TaskListQuery = {
  cursor?: string
  date?: string
  from?: string
  limit?: number
  status?: DailyTaskStatus
  subjectId?: string
  to?: string
}

export type CreateTaskInput = {
  contentType: 'STUDY' | 'GENERAL'
  curriculumSelection?: CurriculumSelectionV2
  description: string | null
  estimatedMinutes: number | null
  endMinuteOfDay: number | null
  scheduledFor: string
  startMinuteOfDay: number | null
  subjectId: string | null
  topicId: string | null
  title: string
}

export type UpdateTaskInput = {
  skipReason?: DailyTaskSkipReason | null
  status?: DailyTaskStatus
  subjectId?: string | null
  topicId?: string | null
}

export type RescheduleTaskInput = {
  endMinuteOfDay: number | null
  scheduledFor: string
  startMinuteOfDay: number | null
}

export type CreateTaskSessionInput = {
  endedAt: string
  focusRating?: number | null
  notes: string | null
  startedAt: string
  studyQualityRating?: number | null
}

export type StudySessionFeedbackInput = {
  focusRating?: number | null
  studyQualityRating?: number | null
}

export type FinishStudySessionInput = StudySessionFeedbackInput & {
  notes?: string | null
}

export type TimerTransitionInput = {
  expectedUpdatedAt: string
}

const withQuery = (
  path: string,
  values: Record<string, number | string | undefined>,
): string => {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) query.set(key, String(value))
  }

  const serialized = query.toString()
  return serialized ? `${path}?${serialized}` : path
}

class PlanningClient {
  listSubjects(cursor?: string): Promise<Page<StudySubject>> {
    return authClient.authorizedRequest<Page<StudySubject>>(
      withQuery('/student/subjects', { cursor, limit: 100 }),
    )
  }

  createSubject(name: string): Promise<StudySubject> {
    return authClient.authorizedRequest<StudySubject>('/student/subjects', {
      body: JSON.stringify({ name }),
      method: 'POST',
    })
  }

  listTopics(subjectId: string, cursor?: string): Promise<Page<StudyTopic>> {
    return authClient.authorizedRequest<Page<StudyTopic>>(
      withQuery(`/student/subjects/${encodeURIComponent(subjectId)}/topics`, {
        cursor,
        limit: 100,
      }),
    )
  }

  listTasks(query: TaskListQuery): Promise<Page<DailyTask>> {
    return authClient.authorizedRequest<Page<DailyTask>>(
      withQuery('/student/daily-tasks', {
        cursor: query.cursor,
        date: query.date,
        from: query.from,
        limit: query.limit ?? 20,
        status: query.status,
        subjectId: query.subjectId,
        to: query.to,
      }),
    )
  }

  getTask(id: string): Promise<DailyTask> {
    return authClient.authorizedRequest<DailyTask>(
      `/student/daily-tasks/${encodeURIComponent(id)}`,
    )
  }

  createTask(input: CreateTaskInput): Promise<DailyTask> {
    return authClient.authorizedRequest<DailyTask>('/student/daily-tasks', {
      body: JSON.stringify(input),
      method: 'POST',
    })
  }

  replaceTaskCurriculumSelection(
    id: string,
    curriculumSelection: CurriculumSelectionV2,
  ): Promise<DailyTask> {
    return authClient.authorizedRequest<DailyTask>(
      `/student/daily-tasks/${encodeURIComponent(id)}/curriculum-targets`,
      {
        body: JSON.stringify({ curriculumSelection }),
        method: 'PATCH',
      },
    )
  }

  toggleTaskCurriculumItem(
    taskId: string,
    itemId: string,
    completed: boolean,
  ): Promise<DailyTask> {
    return requestTaskCurriculumItemToggle<DailyTask>(
      authClient.authorizedRequest.bind(authClient),
      taskId,
      itemId,
      completed,
    )
  }

  listTaskSessions(taskId: string, cursor?: string): Promise<Page<StudySession>> {
    return authClient.authorizedRequest<Page<StudySession>>(
      withQuery('/student/study-sessions', {
        cursor,
        dailyTaskId: taskId,
        limit: 100,
      }),
    )
  }

  async hasTaskSessions(taskId: string): Promise<boolean> {
    const seenCursors = new Set<string>()
    let cursor: string | undefined

    do {
      const page = await this.listTaskSessions(taskId, cursor)
      if (page.items.some((session) => session.cancelledAt === null)) return true
      cursor = page.nextCursor ?? undefined
      if (cursor && seenCursors.has(cursor)) return false
      if (cursor) seenCursors.add(cursor)
    } while (cursor)

    return false
  }

  createTaskSession(
    taskId: string,
    input: CreateTaskSessionInput,
  ): Promise<StudySession> {
    return authClient.authorizedRequest<StudySession>(
      `/student/daily-tasks/${encodeURIComponent(taskId)}/sessions`,
      {
        body: JSON.stringify(input),
        method: 'POST',
      },
    )
  }

  startTask(taskId: string): Promise<StudySession> {
    return authClient.authorizedRequest<StudySession>(
      `/student/tasks/${encodeURIComponent(taskId)}/start`,
      { body: JSON.stringify({}), method: 'POST' },
    )
  }

  getActiveStudySession(): Promise<StudySession | null> {
    return authClient.authorizedRequest<StudySession | null>(
      '/student/study-sessions/active',
    )
  }

  pauseStudySession(sessionId: string, input: TimerTransitionInput): Promise<StudySession> {
    return authClient.authorizedRequest<StudySession>(
      `/student/study-sessions/${encodeURIComponent(sessionId)}/pause`,
      { body: JSON.stringify(input), method: 'PATCH' },
    )
  }

  resumeStudySession(sessionId: string, input: TimerTransitionInput): Promise<StudySession> {
    return authClient.authorizedRequest<StudySession>(
      `/student/study-sessions/${encodeURIComponent(sessionId)}/resume`,
      { body: JSON.stringify(input), method: 'PATCH' },
    )
  }

  switchTask(
    taskId: string,
    currentSessionAction: CurrentSessionAction = 'FINISH',
  ): Promise<SwitchStudySessionResult> {
    return authClient.authorizedRequest<SwitchStudySessionResult>(
      `/student/tasks/${encodeURIComponent(taskId)}/switch`,
      { body: JSON.stringify({ currentSessionAction }), method: 'POST' },
    )
  }

  finishStudySession(sessionId: string, input: FinishStudySessionInput): Promise<StudySession> {
    return authClient.authorizedRequest<StudySession>(
      `/student/study-sessions/${encodeURIComponent(sessionId)}/finish`,
      { body: JSON.stringify(input), method: 'PATCH' },
    )
  }

  updateStudySessionFeedback(
    sessionId: string,
    input: StudySessionFeedbackInput,
  ): Promise<StudySession> {
    return authClient.authorizedRequest<StudySession>(
      `/student/study-sessions/${encodeURIComponent(sessionId)}/feedback`,
      { body: JSON.stringify(input), method: 'PATCH' },
    )
  }

  cancelStudySession(sessionId: string): Promise<StudySession> {
    return authClient.authorizedRequest<StudySession>(
      `/student/study-sessions/${encodeURIComponent(sessionId)}/cancel`,
      { body: JSON.stringify({}), method: 'PATCH' },
    )
  }

  updateTask(id: string, input: UpdateTaskInput): Promise<DailyTask> {
    return authClient.authorizedRequest<DailyTask>(
      `/student/daily-tasks/${encodeURIComponent(id)}`,
      {
        body: JSON.stringify(input),
        method: 'PATCH',
      },
    )
  }

  updateTaskStatus(
    id: string,
    status: DailyTaskStatus,
    skipReason?: DailyTaskSkipReason | null,
  ): Promise<DailyTask> {
    return this.updateTask(id, {
      status,
      ...(status === 'SKIPPED' ? { skipReason: skipReason ?? null } : {}),
    })
  }

  rescheduleTask(id: string, input: RescheduleTaskInput): Promise<DailyTask> {
    return authClient.authorizedRequest<DailyTask>(
      `/student/daily-tasks/${encodeURIComponent(id)}/schedule`,
      {
        body: JSON.stringify(input),
        method: 'PATCH',
      },
    )
  }
}

export const planningClient = new PlanningClient()
