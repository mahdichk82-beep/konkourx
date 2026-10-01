import { ApiError } from '../errors/api-error.js'
import type { CurriculumReadStore } from '../curriculum/store.js'
import { resolveCurriculumTargets } from '../task-curriculum/resolver.js'
import type { CurriculumTargetInput } from '../task-curriculum/types.js'
import { curriculumCoverage } from '../task-curriculum/view.js'
import type { DailyTaskRecord } from '../student-core/types.js'
import type { CounselorTaskStore } from './store.js'
import type {
  CounselorStudentSubject,
  CounselorStudentTopic,
  CounselorTaskActor,
  CounselorTaskListQuery,
  CounselorTaskPage,
  CounselorTaskPageQuery,
  CounselorTaskView,
  CounselorVisibleTaskView,
  CreateCounselorTaskBatchItemInput,
  CreateCounselorTaskBatchResult,
  CreateCounselorTaskBatchView,
  CreateCounselorTaskInput,
  CreateCounselorTaskResult,
  RescheduleCounselorTaskResult,
} from './types.js'

const ensureCounselor = (actor: CounselorTaskActor): void => {
  if (actor.role !== 'COUNSELOR') {
    throw new ApiError(403, 'ROLE_FORBIDDEN', 'Counselor access is required')
  }
  if (actor.status !== 'ACTIVE') {
    throw new ApiError(403, 'ACCOUNT_INACTIVE', 'Account is inactive')
  }
}

const dateOnly = (value: string): Date => new Date(`${value}T00:00:00.000Z`)
const validDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = dateOnly(value)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

const page = <T extends { id: string }>(
  items: T[],
  query: CounselorTaskPageQuery,
): CounselorTaskPage<T> => {
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 100)
  const selected = items.slice(0, limit)
  return {
    items: selected,
    nextCursor: items.length > limit ? selected.at(-1)?.id ?? null : null,
  }
}

const toTaskView = ({ createdByUserId: _createdByUserId, curriculumTargets, ...task }: DailyTaskRecord): CounselorTaskView => ({
  ...task,
  partialAt: task.partialAt ?? null,
  curriculum: curriculumCoverage(curriculumTargets),
})

const toVisibleTaskView = ({
  completedStudySessionCount,
  hasActiveStudySession,
  hasValidAssessmentAttempt,
  recordedMinutes,
  studySessionCount,
  curriculumTargets,
  ...task
}: import('./types.js').CounselorVisibleTaskRecord): CounselorVisibleTaskView => ({
  ...task,
  partialAt: task.partialAt ?? null,
  curriculum: curriculumCoverage(curriculumTargets),
  completedStudySessionCount,
  hasActiveStudySession,
  hasValidAssessmentAttempt,
  recordedMinutes,
  studySessionCount,
})

const requireCurriculum = (curriculum: CurriculumReadStore | undefined): CurriculumReadStore => {
  if (!curriculum) throw new ApiError(503, 'CURRICULUM_UNAVAILABLE', 'Canonical Curriculum is unavailable')
  return curriculum
}

const throwCreateFailure = (
  result:
    | Exclude<CreateCounselorTaskResult, { ok: true }>
    | Exclude<CreateCounselorTaskBatchResult, { ok: true }>,
): never => {
  switch (result.reason) {
    case 'COUNSELOR_PROFILE_NOT_FOUND':
      throw new ApiError(403, 'COUNSELOR_PROFILE_REQUIRED', 'Counselor profile is required')
    case 'STUDENT_NOT_FOUND':
      throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student not found')
    case 'SUBJECT_NOT_FOUND':
      throw new ApiError(404, 'SUBJECT_NOT_FOUND', 'Study subject not found')
    case 'SUBJECT_ARCHIVED':
      throw new ApiError(409, 'SUBJECT_ARCHIVED', 'Archived subjects cannot be assigned to new tasks')
    case 'TOPIC_SUBJECT_REQUIRED':
      throw new ApiError(400, 'TOPIC_SUBJECT_REQUIRED', 'A topic requires its subject')
    case 'TOPIC_NOT_FOUND':
      throw new ApiError(404, 'TOPIC_NOT_FOUND', 'Topic not found')
    case 'TOPIC_SUBJECT_MISMATCH':
      throw new ApiError(409, 'TOPIC_SUBJECT_MISMATCH', 'Topic does not belong to the selected subject')
    case 'TOPIC_ARCHIVED':
      throw new ApiError(409, 'TOPIC_ARCHIVED', 'Archived topics cannot be assigned to tasks')
  }
}

const throwRescheduleFailure = (
  result: Exclude<RescheduleCounselorTaskResult, { ok: true }>,
): never => {
  switch (result.reason) {
    case 'STUDENT_NOT_FOUND':
      throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student not found')
    case 'TASK_NOT_FOUND':
      throw new ApiError(404, 'TASK_NOT_FOUND', 'Daily task not found')
    case 'TASK_SOURCE_FORBIDDEN':
      throw new ApiError(403, 'TASK_RESCHEDULE_FORBIDDEN', 'Personal student tasks cannot be rescheduled by counselors')
    case 'TASK_EXECUTED':
      throw new ApiError(409, 'TASK_ALREADY_EXECUTED', 'Tasks with recorded execution cannot be rescheduled')
  }
}

export const createCounselorTaskServices = (
  store: CounselorTaskStore,
  curriculum?: CurriculumReadStore,
) => ({
  async list(
    actor: CounselorTaskActor,
    studentProfileId: string,
    query: CounselorTaskListQuery,
  ): Promise<CounselorTaskPage<CounselorVisibleTaskView>> {
    ensureCounselor(actor)
    if (query.scheduledFrom && !validDate(query.scheduledFrom)) {
      throw new ApiError(400, 'TASK_DATE_INVALID', 'Task date range is invalid')
    }
    if (query.scheduledTo && !validDate(query.scheduledTo)) {
      throw new ApiError(400, 'TASK_DATE_INVALID', 'Task date range is invalid')
    }
    if ((query.scheduledFrom === undefined) !== (query.scheduledTo === undefined)) {
      throw new ApiError(400, 'TASK_DATE_RANGE_INVALID', 'Task date range is invalid')
    }
    const scheduledFrom = query.scheduledFrom ? dateOnly(query.scheduledFrom) : undefined
    const scheduledTo = query.scheduledTo ? dateOnly(query.scheduledTo) : undefined
    if (scheduledFrom && scheduledTo && scheduledTo < scheduledFrom) {
      throw new ApiError(400, 'TASK_DATE_RANGE_INVALID', 'Task date range is invalid')
    }
    const {
      scheduledFrom: _scheduledFromInput,
      scheduledTo: _scheduledToInput,
      ...storeQuery
    } = query
    const result = await store.listAssignedStudentTasks(actor.id, studentProfileId, {
      ...storeQuery,
      ...(scheduledFrom ? { scheduledFrom } : {}),
      ...(scheduledTo ? { scheduledTo } : {}),
    })
    if (!result.ok) {
      throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student not found')
    }
    return page(result.value.map(toVisibleTaskView), query)
  },

  async listSubjects(
    actor: CounselorTaskActor,
    studentProfileId: string,
    query: CounselorTaskPageQuery,
  ): Promise<CounselorTaskPage<CounselorStudentSubject>> {
    ensureCounselor(actor)
    const result = await store.listAssignedStudentSubjects(actor.id, studentProfileId, query)
    if (!result.ok) {
      throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student not found')
    }
    return page(result.value, query)
  },

  async listTopics(
    actor: CounselorTaskActor,
    studentProfileId: string,
    subjectId: string,
    query: CounselorTaskPageQuery,
  ): Promise<CounselorTaskPage<CounselorStudentTopic>> {
    ensureCounselor(actor)
    const result = await store.listAssignedStudentTopics(
      actor.id,
      studentProfileId,
      subjectId,
      query,
    )
    if (!result.ok) {
      if (result.reason === 'STUDENT_NOT_FOUND') {
        throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student not found')
      }
      throw new ApiError(404, 'SUBJECT_NOT_FOUND', 'Study subject not found')
    }
    return page(result.value, query)
  },

  async create(
    actor: CounselorTaskActor,
    studentProfileId: string,
    input: CreateCounselorTaskInput,
  ): Promise<CounselorTaskView> {
    ensureCounselor(actor)
    if (!validDate(input.scheduledFor)) {
      throw new ApiError(400, 'TASK_DATE_INVALID', 'Task date is invalid')
    }
    if (input.topicId && !input.subjectId) {
      throw new ApiError(400, 'TOPIC_SUBJECT_REQUIRED', 'A topic requires its subject')
    }

    const resolvedTargets = (input.curriculumTargets?.length ?? 0) > 0
      ? resolveCurriculumTargets(requireCurriculum(curriculum), input.curriculumTargets!)
      : []
    const result = await store.createAssignedStudentTask(actor.id, studentProfileId,
      {
        completedAt: null,
        partialAt: null,
        createdByUserId: actor.id,
        description: input.description ?? null,
        estimatedMinutes: input.estimatedMinutes,
        plannedTestCount: 0,
        scheduledFor: dateOnly(input.scheduledFor),
        skipReason: null,
        skippedAt: null,
        source: 'COUNSELOR',
        status: 'PENDING',
        studentProfileId,
        studyPlanId: null,
        subjectId: input.subjectId,
        title: input.title.trim(),
        topicId: input.topicId,
      },
      resolvedTargets,
    )

    if (!result.ok) return throwCreateFailure(result)
    return toTaskView(result.value)
  },

  async createBatch(
    actor: CounselorTaskActor,
    studentProfileId: string,
    input: { tasks: CreateCounselorTaskBatchItemInput[] },
  ): Promise<CreateCounselorTaskBatchView> {
    ensureCounselor(actor)
    for (const task of input.tasks) {
      if (!validDate(task.scheduledFor)) {
        throw new ApiError(400, 'TASK_DATE_INVALID', 'Task date is invalid')
      }
      if (task.topicId && !task.subjectId) {
        throw new ApiError(400, 'TOPIC_SUBJECT_REQUIRED', 'A topic requires its subject')
      }
    }

    const result = await store.createAssignedStudentTasksBatch(
      actor.id,
      studentProfileId,
      input.tasks.map((task) => ({
          completedAt: null,
          partialAt: null,
          createdByUserId: actor.id,
          description: task.description,
          estimatedMinutes: task.plannedMinutes,
          plannedTestCount: task.plannedTestCount,
          scheduledFor: dateOnly(task.scheduledFor),
          skipReason: null,
          skippedAt: null,
          source: 'COUNSELOR',
          status: 'PENDING',
          studentProfileId,
          studyPlanId: null,
          subjectId: task.subjectId,
          title: task.title.trim(),
          topicId: task.topicId,
      })),
      input.tasks.map((task) => (task.curriculumTargets?.length ?? 0) > 0
        ? resolveCurriculumTargets(requireCurriculum(curriculum), task.curriculumTargets!)
        : []),
    )

    if (!result.ok) return throwCreateFailure(result)
    return {
      created: result.value.length,
      tasks: result.value.map(toTaskView),
    }
  },

  async reschedule(
    actor: CounselorTaskActor,
    studentProfileId: string,
    taskId: string,
    input: { scheduledFor: string },
  ): Promise<CounselorTaskView> {
    ensureCounselor(actor)
    if (!validDate(input.scheduledFor)) {
      throw new ApiError(400, 'TASK_DATE_INVALID', 'Task date is invalid')
    }
    const result = await store.rescheduleAssignedStudentTask(
      actor.id,
      studentProfileId,
      taskId,
      dateOnly(input.scheduledFor),
    )
    if (!result.ok) return throwRescheduleFailure(result)
    return toTaskView(result.value)
  },
  async replaceCurriculumTargets(
    actor: CounselorTaskActor,
    studentProfileId: string,
    taskId: string,
    input: { curriculumTargets: CurriculumTargetInput[] },
  ) {
    ensureCounselor(actor)
    const method = store.replaceAssignedTaskCurriculumTargets
    if (!method) throw new ApiError(503, 'TASK_CURRICULUM_UNAVAILABLE', 'Task Curriculum persistence is unavailable')
    const targets = input.curriculumTargets.length > 0
      ? resolveCurriculumTargets(requireCurriculum(curriculum), input.curriculumTargets)
      : []
    const result = await method(actor.id, studentProfileId, taskId, targets)
    if (!result.ok) {
      if (result.reason === 'STUDENT_NOT_FOUND') throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student not found')
      if (result.reason === 'TASK_NOT_FOUND') throw new ApiError(404, 'TASK_NOT_FOUND', 'Daily task not found')
      if (result.reason === 'TASK_SOURCE_FORBIDDEN') throw new ApiError(403, 'TASK_UPDATE_FORBIDDEN', 'Student personal task targets cannot be changed by counselors')
      if (result.reason === 'TASK_NOT_PENDING') throw new ApiError(409, 'TASK_TERMINAL', 'Curriculum targets are immutable after task closure')
      throw new ApiError(409, 'TASK_CURRICULUM_EXECUTION_STARTED', 'Curriculum targets are immutable after execution starts')
    }
    return toTaskView(result.value)
  },
})

export type CounselorTaskServices = ReturnType<typeof createCounselorTaskServices>
export type { CounselorTaskStore } from './store.js'
