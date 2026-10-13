import { ApiError } from '../errors/api-error.js'
import type { CurriculumReadStore } from '../curriculum/store.js'
import {
  curriculumWriteItems,
  resolveNewTaskCurriculum,
  validateTaskContent,
} from '../task-domain/validation.js'
import type { CurriculumWriteInput } from '../task-curriculum/types.js'
import { curriculumCoverage } from '../task-curriculum/view.js'
import { deriveMiniBoxSpan, validateTaskScheduleWindow } from '../task-scheduling/schedule.js'
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
  UpdateCounselorTaskInput,
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

const requireValidSchedule = (input: {
  startMinuteOfDay?: number | null
  endMinuteOfDay?: number | null
}): void => {
  if (validateTaskScheduleWindow(input) !== null) {
    throw new ApiError(400, 'TASK_SCHEDULE_INVALID', 'Task time range must be same-day and aligned to 15-minute boundaries')
  }
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

const toTaskView = ({
  createdByUserId: _createdByUserId,
  curriculumTargets,
  deadlineEligibilityStartedAt: _deadlineEligibilityStartedAt,
  deadlineMisses,
  ...task
}: DailyTaskRecord): CounselorTaskView => ({
  ...task,
  actualSolvedTestCount: task.actualSolvedTestCount ?? 0,
  startMinuteOfDay: task.startMinuteOfDay ?? null,
  endMinuteOfDay: task.endMinuteOfDay ?? null,
  miniBoxSpan: deriveMiniBoxSpan(task),
  partialAt: task.partialAt ?? null,
  curriculum: curriculumCoverage(curriculumTargets),
  deadlineMisses: (deadlineMisses ?? []).map(({
    dailyTaskId: _dailyTaskId,
    id: _id,
    ...miss
  }) => miss),
})

const toVisibleTaskView = ({
  completedStudySessionCount,
  hasActiveStudySession,
  hasValidAssessmentAttempt,
  recordedMinutes,
  studySessionCount,
  deadlineEligibilityStartedAt: _deadlineEligibilityStartedAt,
  deadlineMisses,
  curriculumTargets,
  ...task
}: import('./types.js').CounselorVisibleTaskRecord): CounselorVisibleTaskView => ({
  ...task,
  actualSolvedTestCount: task.actualSolvedTestCount ?? 0,
  startMinuteOfDay: task.startMinuteOfDay ?? null,
  endMinuteOfDay: task.endMinuteOfDay ?? null,
  miniBoxSpan: deriveMiniBoxSpan(task),
  partialAt: task.partialAt ?? null,
  curriculum: curriculumCoverage(curriculumTargets),
  deadlineMisses: (deadlineMisses ?? []).map(({
    dailyTaskId: _dailyTaskId,
    id: _id,
    ...miss
  }) => miss),
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
  operation: 'RESCHEDULE' | 'UPDATE' = 'RESCHEDULE',
): never => {
  switch (result.reason) {
    case 'STUDENT_NOT_FOUND':
      throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student not found')
    case 'TASK_NOT_FOUND':
      throw new ApiError(404, 'TASK_NOT_FOUND', 'Daily task not found')
    case 'TASK_SOURCE_FORBIDDEN':
      throw new ApiError(
        403,
        operation === 'UPDATE' ? 'TASK_UPDATE_FORBIDDEN' : 'TASK_RESCHEDULE_FORBIDDEN',
        'Personal student tasks cannot be changed by counselors',
      )
    case 'TASK_EXECUTED':
      throw new ApiError(409, 'TASK_ALREADY_EXECUTED', 'Tasks with recorded execution cannot be rescheduled')
  }
}

export const createCounselorTaskServices = (
  store: CounselorTaskStore,
  curriculum?: CurriculumReadStore,
) => {
  const assignedTrack = async (counselorUserId: string, studentProfileId: string) => {
    const result = await store.findAssignedStudentTrack(counselorUserId, studentProfileId)
    if (!result.ok) throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student not found')
    return result.value
  }
  return ({
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
    validateTaskContent(input.contentType, input.subjectId, input.topicId, curriculumWriteItems(input))
    if (!validDate(input.scheduledFor)) {
      throw new ApiError(400, 'TASK_DATE_INVALID', 'Task date is invalid')
    }
    requireValidSchedule(input)
    if (input.topicId && !input.subjectId) {
      throw new ApiError(400, 'TOPIC_SUBJECT_REQUIRED', 'A topic requires its subject')
    }

    const track = curriculumWriteItems(input).length > 0
      ? await assignedTrack(actor.id, studentProfileId)
      : null
    const resolvedTargets = curriculumWriteItems(input).length > 0
      ? resolveNewTaskCurriculum(requireCurriculum(curriculum), track, input)
      : []
    const result = await store.createAssignedStudentTask(actor.id, studentProfileId,
      {
        contentType: input.contentType ?? null,
        completedAt: null,
        partialAt: null,
        createdByUserId: actor.id,
        description: input.description ?? null,
        estimatedMinutes: input.estimatedMinutes,
        startMinuteOfDay: input.startMinuteOfDay ?? null,
        endMinuteOfDay: input.endMinuteOfDay ?? null,
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
      track,
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
      validateTaskContent(task.contentType, task.subjectId, task.topicId, curriculumWriteItems(task))
      if (!validDate(task.scheduledFor)) {
        throw new ApiError(400, 'TASK_DATE_INVALID', 'Task date is invalid')
      }
      requireValidSchedule(task)
      if (task.topicId && !task.subjectId) {
        throw new ApiError(400, 'TOPIC_SUBJECT_REQUIRED', 'A topic requires its subject')
      }
    }

    const track = input.tasks.some((task) => curriculumWriteItems(task).length > 0)
      ? await assignedTrack(actor.id, studentProfileId)
      : null

    const result = await store.createAssignedStudentTasksBatch(
      actor.id,
      studentProfileId,
      input.tasks.map((task) => ({
          contentType: task.contentType ?? null,
          completedAt: null,
          partialAt: null,
          createdByUserId: actor.id,
          description: task.description,
          estimatedMinutes: task.plannedMinutes,
          startMinuteOfDay: task.startMinuteOfDay ?? null,
          endMinuteOfDay: task.endMinuteOfDay ?? null,
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
      input.tasks.map((task) => curriculumWriteItems(task).length > 0
        ? resolveNewTaskCurriculum(requireCurriculum(curriculum), track, task)
        : []),
      track,
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
    input: {
      scheduledFor?: string
      startMinuteOfDay?: number | null
      endMinuteOfDay?: number | null
    },
  ): Promise<CounselorTaskView> {
    ensureCounselor(actor)
    if (input.scheduledFor !== undefined && !validDate(input.scheduledFor)) {
      throw new ApiError(400, 'TASK_DATE_INVALID', 'Task date is invalid')
    }
    requireValidSchedule(input)
    const result = await store.rescheduleAssignedStudentTask(
      actor.id,
      studentProfileId,
      taskId,
      {
        ...(input.scheduledFor === undefined ? {} : { scheduledFor: dateOnly(input.scheduledFor) }),
        ...(input.startMinuteOfDay === undefined ? {} : { startMinuteOfDay: input.startMinuteOfDay }),
        ...(input.endMinuteOfDay === undefined ? {} : { endMinuteOfDay: input.endMinuteOfDay }),
      },
    )
    if (!result.ok) return throwRescheduleFailure(result)
    return toTaskView(result.value)
  },
  async update(
    actor: CounselorTaskActor,
    studentProfileId: string,
    taskId: string,
    input: UpdateCounselorTaskInput,
  ): Promise<CounselorTaskView> {
    ensureCounselor(actor)
    if (input.scheduledFor !== undefined && !validDate(input.scheduledFor)) {
      throw new ApiError(400, 'TASK_DATE_INVALID', 'Task date is invalid')
    }
    requireValidSchedule(input)
    const result = await store.rescheduleAssignedStudentTask(
      actor.id,
      studentProfileId,
      taskId,
      {
        ...(input.title === undefined ? {} : { title: input.title.trim() }),
        ...(input.description === undefined ? {} : { description: input.description }),
        ...(input.estimatedMinutes === undefined ? {} : { estimatedMinutes: input.estimatedMinutes }),
        ...(input.scheduledFor === undefined ? {} : { scheduledFor: dateOnly(input.scheduledFor) }),
        ...(input.startMinuteOfDay === undefined ? {} : { startMinuteOfDay: input.startMinuteOfDay }),
        ...(input.endMinuteOfDay === undefined ? {} : { endMinuteOfDay: input.endMinuteOfDay }),
      },
    )
    if (!result.ok) return throwRescheduleFailure(result, 'UPDATE')
    return toTaskView(result.value)
  },
  async replaceCurriculumTargets(
    actor: CounselorTaskActor,
    studentProfileId: string,
    taskId: string,
    input: CurriculumWriteInput,
  ) {
    ensureCounselor(actor)
    const method = store.replaceAssignedTaskCurriculumTargets
    if (!method) throw new ApiError(503, 'TASK_CURRICULUM_UNAVAILABLE', 'Task Curriculum persistence is unavailable')
    const track = curriculumWriteItems(input).length > 0
      ? await assignedTrack(actor.id, studentProfileId)
      : null
    const targets = curriculumWriteItems(input).length > 0
      ? resolveNewTaskCurriculum(requireCurriculum(curriculum), track, input)
      : []
    const result = await method(actor.id, studentProfileId, taskId, targets, track)
    if (!result.ok) {
      if (result.reason === 'STUDENT_NOT_FOUND') throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student not found')
      if (result.reason === 'TASK_NOT_FOUND') throw new ApiError(404, 'TASK_NOT_FOUND', 'Daily task not found')
      if (result.reason === 'TASK_SOURCE_FORBIDDEN') throw new ApiError(403, 'TASK_UPDATE_FORBIDDEN', 'Student personal task targets cannot be changed by counselors')
      if (result.reason === 'TASK_NOT_PENDING') throw new ApiError(409, 'TASK_TERMINAL', 'Curriculum targets are immutable after task closure')
      if (result.reason === 'TASK_GENERAL_TARGET_FORBIDDEN') throw new ApiError(409, result.reason, 'General tasks cannot have Curriculum targets')
      if (result.reason === 'TASK_STUDY_TARGET_REQUIRED') throw new ApiError(409, result.reason, 'Study tasks require a Curriculum target')
      throw new ApiError(409, 'TASK_CURRICULUM_EXECUTION_STARTED', 'Curriculum targets are immutable after execution starts')
    }
    return toTaskView(result.value)
  },
  })
}

export type CounselorTaskServices = ReturnType<typeof createCounselorTaskServices>
export type { CounselorTaskStore } from './store.js'
