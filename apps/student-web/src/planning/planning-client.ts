import { authClient } from '../auth/auth-client'
import type {
  PlanningCurriculumTargetInput,
  PlanningCurriculumTargetSnapshot,
} from '@konkourx/curriculum-browser'

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

export type DailyTask = {
  contentType: 'STUDY' | 'GENERAL' | null
  completedAt: string | null
  createdAt: string
  curriculum: {
    completedItemCount: number
    remainingItemCount: number
    targets: PlanningCurriculumTargetSnapshot[]
    totalItemCount: number
  }
  description: string | null
  estimatedMinutes: number | null
  id: string
  plannedTestCount: number
  scheduledFor: string
  skipReason: DailyTaskSkipReason | null
  skippedAt: string | null
  source: DailyTaskSource
  status: DailyTaskStatus
  subjectId: string | null
  topicId: string | null
  title: string
  updatedAt: string
}

export type StudySession = {
  cancelledAt: string | null
  createdAt: string
  dailyTaskId: string | null
  durationMinutes: number | null
  endedAt: string | null
  focusRating: number | null
  id: string
  notes: string | null
  startedAt: string
  studyQualityRating: number | null
  subjectId: string | null
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
  curriculumTargets: PlanningCurriculumTargetInput[]
  description: string | null
  estimatedMinutes: number | null
  scheduledFor: string
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

  replaceTaskCurriculumTargets(
    id: string,
    curriculumTargets: PlanningCurriculumTargetInput[],
  ): Promise<DailyTask> {
    return authClient.authorizedRequest<DailyTask>(
      `/student/daily-tasks/${encodeURIComponent(id)}/curriculum-targets`,
      {
        body: JSON.stringify({ curriculumTargets }),
        method: 'PATCH',
      },
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

  rescheduleTask(id: string, scheduledFor: string): Promise<DailyTask> {
    return authClient.authorizedRequest<DailyTask>(
      `/student/daily-tasks/${encodeURIComponent(id)}/schedule`,
      {
        body: JSON.stringify({ scheduledFor }),
        method: 'PATCH',
      },
    )
  }
}

export const planningClient = new PlanningClient()
