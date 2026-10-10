import { authClient } from '../auth/auth-client'
import type {
  CurriculumSelectionV2,
  PlanningCurriculumTargetSnapshot,
} from '@konkourx/curriculum-browser'

export type CounselorTaskSubject = {
  id: string
  name: string
}

export type CounselorTaskTopic = {
  id: string
  subjectId: string
  title: string
}

export type CounselorTaskSkipReason = 'NO_TIME' | 'TOO_DIFFICULT' | 'FORGOT' | 'OTHER'

export type CounselorTask = {
  actualSolvedTestCount: number
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
  endMinuteOfDay: number | null
  estimatedMinutes: number | null
  id: string
  plannedTestCount: number
  scheduledFor: string
  skipReason: CounselorTaskSkipReason | null
  skippedAt: string | null
  source: 'PERSONAL' | 'COUNSELOR'
  startMinuteOfDay: number | null
  status: 'PENDING' | 'COMPLETED' | 'PARTIAL' | 'SKIPPED'
  studentProfileId: string
  studyPlanId: string | null
  subjectId: string | null
  title: string
  topicId: string | null
  updatedAt: string
}

export type CounselorVisibleTask = CounselorTask & {
  completedStudySessionCount: number
  hasActiveStudySession: boolean
  hasValidAssessmentAttempt: boolean
  recordedMinutes: number
  studySessionCount: number
}

export type CounselorCreatedTask = CounselorTask & {
  source: 'COUNSELOR'
  status: 'PENDING'
}

export type Page<T> = {
  items: T[]
  nextCursor: string | null
}

export type CreateCounselorTaskInput = {
  contentType: 'STUDY' | 'GENERAL'
  curriculumSelection?: CurriculumSelectionV2
  description: string | null
  endMinuteOfDay: number | null
  estimatedMinutes: number | null
  scheduledFor: string
  startMinuteOfDay: number | null
  subjectId: string | null
  title: string
  topicId: string | null
}

export type CreateCounselorBatchTaskInput = {
  contentType: 'STUDY' | 'GENERAL'
  curriculumSelection?: CurriculumSelectionV2
  description: string | null
  endMinuteOfDay: number | null
  plannedMinutes: number
  plannedTestCount: number
  scheduledFor: string
  startMinuteOfDay: number | null
  subjectId: string | null
  title: string
  topicId: string | null
}

export type CreateCounselorTaskBatchResult = {
  created: number
  tasks: CounselorCreatedTask[]
}

export type RescheduleCounselorTaskInput = {
  endMinuteOfDay: number | null
  scheduledFor: string
  startMinuteOfDay: number | null
}

const resourcePath = (studentProfileId: string, suffix: string) =>
  `/counselor/students/${encodeURIComponent(studentProfileId)}${suffix}`

const withPage = (
  path: string,
  cursor?: string,
  limit = 100,
  range?: { from: string; to: string },
) => {
  const query = new URLSearchParams({ limit: String(limit) })
  if (cursor) query.set('cursor', cursor)
  if (range) {
    query.set('from', range.from)
    query.set('to', range.to)
  }
  return `${path}?${query.toString()}`
}

const listAll = async <T>(path: string): Promise<T[]> => {
  const items: T[] = []
  let cursor: string | undefined

  do {
    const page = await authClient.authorizedRequest<Page<T>>(withPage(path, cursor))
    items.push(...page.items)
    cursor = page.nextCursor ?? undefined
  } while (cursor)

  return items
}

export const studentTasksClient = {
  listTasks(
    studentProfileId: string,
    cursor?: string,
    range?: { from: string; to: string },
  ): Promise<Page<CounselorVisibleTask>> {
    return authClient.authorizedRequest<Page<CounselorVisibleTask>>(
      withPage(resourcePath(studentProfileId, '/tasks'), cursor, range ? 100 : 20, range),
    )
  },

  listSubjects(studentProfileId: string): Promise<CounselorTaskSubject[]> {
    return listAll<CounselorTaskSubject>(resourcePath(studentProfileId, '/subjects'))
  },

  listTopics(
    studentProfileId: string,
    subjectId: string,
  ): Promise<CounselorTaskTopic[]> {
    return listAll<CounselorTaskTopic>(
      resourcePath(
        studentProfileId,
        `/subjects/${encodeURIComponent(subjectId)}/topics`,
      ),
    )
  },

  create(
    studentProfileId: string,
    input: CreateCounselorTaskInput,
  ): Promise<CounselorCreatedTask> {
    return authClient.authorizedRequest<CounselorCreatedTask>(
      resourcePath(studentProfileId, '/tasks'),
      {
        body: JSON.stringify(input),
        method: 'POST',
      },
    )
  },

  createBatch(
    studentProfileId: string,
    tasks: CreateCounselorBatchTaskInput[],
  ): Promise<CreateCounselorTaskBatchResult> {
    return authClient.authorizedRequest<CreateCounselorTaskBatchResult>(
      resourcePath(studentProfileId, '/tasks/batch'),
      {
        body: JSON.stringify({ tasks }),
        method: 'POST',
      },
    )
  },

  reschedule(
    studentProfileId: string,
    taskId: string,
    input: RescheduleCounselorTaskInput,
  ): Promise<CounselorTask> {
    return authClient.authorizedRequest<CounselorTask>(
      resourcePath(
        studentProfileId,
        `/tasks/${encodeURIComponent(taskId)}/schedule`,
      ),
      {
        body: JSON.stringify(input),
        method: 'PATCH',
      },
    )
  },

  replaceCurriculumSelection(
    studentProfileId: string,
    taskId: string,
    curriculumSelection: CurriculumSelectionV2,
  ): Promise<CounselorTask> {
    return authClient.authorizedRequest<CounselorTask>(
      resourcePath(
        studentProfileId,
        `/tasks/${encodeURIComponent(taskId)}/curriculum-targets`,
      ),
      {
        body: JSON.stringify({ curriculumSelection }),
        method: 'PATCH',
      },
    )
  },
}
