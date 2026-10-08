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
import type { StudentCoreStore } from './store.js'
import type {
  DailyTaskRecord,
  DailyTaskSkipReason,
  DailyTaskStatus,
  DailyTaskView,
  DomainStudent,
  Page,
  PageQuery,
  StudyPlanRecord,
  StudyPlanStatus,
  StudySubjectRecord,
  TopicRecord,
  StudentTaskCreateInput,
  RescheduleTaskInput,
} from './types.js'

const requireProfile = async (store: StudentCoreStore, actor: DomainStudent) => {
  if (actor.role !== 'STUDENT') throw new ApiError(403, 'ROLE_FORBIDDEN', 'Student access is required')
  if (actor.status !== 'ACTIVE') throw new ApiError(403, 'ACCOUNT_INACTIVE', 'Account is inactive')
  const profile = await store.findStudentProfileByUserId(actor.id)
  if (!profile) throw new ApiError(409, 'STUDENT_PROFILE_REQUIRED', 'Student profile is required')
  return profile
}

const page = <T extends { id: string }>(items: T[], query: PageQuery = {}): Page<T> => {
  const limit = Math.min(Math.max(query.limit ?? 50, 1), 100)
  const start = query.cursor ? Math.max(items.findIndex((item) => item.id === query.cursor) + 1, 0) : 0
  const selected = items.slice(start, start + limit)
  return { items: selected, nextCursor: items.length > start + limit ? selected.at(-1)?.id ?? null : null }
}

const dateOnly = (value: string): Date => new Date(`${value}T00:00:00.000Z`)
const toTaskView = ({ createdByUserId: _createdByUserId, curriculumTargets, ...task }: DailyTaskRecord): DailyTaskView => ({
  ...task,
  startMinuteOfDay: task.startMinuteOfDay ?? null,
  endMinuteOfDay: task.endMinuteOfDay ?? null,
  miniBoxSpan: deriveMiniBoxSpan(task),
  partialAt: task.partialAt ?? null,
  curriculum: curriculumCoverage(curriculumTargets),
})
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
const conflict = (error: unknown, code: string, message: string): never => {
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') throw new ApiError(409, code, message)
  throw error
}

const requireTaskTopicConsistency = async (
  store: StudentCoreStore,
  profileId: string,
  subjectId: string | null,
  topicId: string | null,
): Promise<void> => {
  if (!topicId) return
  if (!subjectId) {
    throw new ApiError(400, 'TOPIC_SUBJECT_REQUIRED', 'A topic requires its subject')
  }
  const topic = await store.findTopicById(profileId, topicId)
  if (!topic) throw new ApiError(404, 'TOPIC_NOT_FOUND', 'Topic not found')
  if (topic.subjectId !== subjectId) {
    throw new ApiError(409, 'TOPIC_SUBJECT_MISMATCH', 'Topic does not belong to the selected subject')
  }
  if (topic.archivedAt) {
    throw new ApiError(409, 'TOPIC_ARCHIVED', 'Archived topics cannot be assigned to tasks')
  }
}

const plannedTaskFields = [
  'studyPlanId',
  'subjectId',
  'topicId',
  'title',
  'description',
  'estimatedMinutes',
] as const

const requireCurriculum = (curriculum: CurriculumReadStore | undefined): CurriculumReadStore => {
  if (!curriculum) throw new ApiError(503, 'CURRICULUM_UNAVAILABLE', 'Canonical Curriculum is unavailable')
  return curriculum
}

const validateCurriculumOutcome = (task: DailyTaskRecord, status: DailyTaskStatus): void => {
  const coverage = curriculumCoverage(task.curriculumTargets)
  if (coverage.totalItemCount === 0) {
    if (status === 'PARTIAL') {
      throw new ApiError(409, 'TASK_OUTCOME_INVALID', 'PARTIAL requires Curriculum execution items')
    }
    return
  }
  if (status === 'COMPLETED' && coverage.completedItemCount !== coverage.totalItemCount) {
    throw new ApiError(409, 'TASK_OUTCOME_INVALID', 'COMPLETED requires all Curriculum items to be completed')
  }
  if (status === 'PARTIAL' && (
    coverage.completedItemCount === 0
    || coverage.completedItemCount === coverage.totalItemCount
  )) {
    throw new ApiError(409, 'TASK_OUTCOME_INVALID', 'PARTIAL requires completed and unfinished Curriculum items')
  }
  if (status === 'SKIPPED' && coverage.completedItemCount > 0) {
    throw new ApiError(409, 'TASK_OUTCOME_INVALID', 'Use PARTIAL when some Curriculum items are completed')
  }
}

export const createStudentCoreServices = (
  store: StudentCoreStore,
  now = () => new Date(),
  curriculum?: CurriculumReadStore,
) => {
  const subjects = {
    async list(actor: DomainStudent, query?: PageQuery): Promise<Page<StudySubjectRecord>> {
      const profile = await requireProfile(store, actor)
      return page(await store.listSubjects(profile.id, query), query)
    },
    async get(actor: DomainStudent, id: string) {
      const profile = await requireProfile(store, actor)
      const result = await store.findSubjectById(profile.id, id)
      if (!result) throw new ApiError(404, 'SUBJECT_NOT_FOUND', 'Study subject not found')
      return result
    },
    async create(actor: DomainStudent, input: { name: string }) {
      const profile = await requireProfile(store, actor)
      const name = input.name.trim()
      if (!name) throw new ApiError(400, 'VALIDATION_ERROR', 'Subject name is required')
      try {
        return await store.createSubject({ studentProfileId: profile.id, name, normalizedName: name.toLocaleLowerCase() })
      } catch (error) {
        return conflict(error, 'SUBJECT_CONFLICT', 'Study subject already exists')
      }
    },
    async update(actor: DomainStudent, id: string, input: { name?: string; archived?: boolean }) {
      const profile = await requireProfile(store, actor)
      if (!await store.findSubjectById(profile.id, id)) throw new ApiError(404, 'SUBJECT_NOT_FOUND', 'Study subject not found')
      const data = input.name === undefined ? {} : { name: input.name.trim(), normalizedName: input.name.trim().toLocaleLowerCase() }
      try {
        const result = await store.updateSubject(profile.id, id, { ...data, ...(input.archived === undefined ? {} : { archivedAt: input.archived ? now() : null }) })
        if (!result) throw new ApiError(404, 'SUBJECT_NOT_FOUND', 'Study subject not found')
        return result
      } catch (error) {
        return conflict(error, 'SUBJECT_CONFLICT', 'Study subject already exists')
      }
    },
  }

  const topics = {
    async list(actor: DomainStudent, subjectId: string, query?: PageQuery): Promise<Page<TopicRecord>> {
      const profile = await requireProfile(store, actor)
      if (!await store.findSubjectById(profile.id, subjectId)) {
        throw new ApiError(404, 'SUBJECT_NOT_FOUND', 'Study subject not found')
      }
      return page(await store.listTopics(profile.id, subjectId, query), query)
    },
    async get(actor: DomainStudent, id: string) {
      const profile = await requireProfile(store, actor)
      const result = await store.findTopicById(profile.id, id)
      if (!result) throw new ApiError(404, 'TOPIC_NOT_FOUND', 'Topic not found')
      return result
    },
    async create(actor: DomainStudent, subjectId: string, input: { title: string }) {
      const profile = await requireProfile(store, actor)
      const subject = await store.findSubjectById(profile.id, subjectId)
      if (!subject) throw new ApiError(404, 'SUBJECT_NOT_FOUND', 'Study subject not found')
      if (subject.archivedAt) {
        throw new ApiError(409, 'SUBJECT_ARCHIVED', 'Archived subjects cannot receive new topics')
      }
      const title = input.title.trim()
      if (!title) throw new ApiError(400, 'VALIDATION_ERROR', 'Topic title is required')
      try {
        return await store.createTopic({
          normalizedTitle: title.toLocaleLowerCase(),
          subjectId,
          title,
        })
      } catch (error) {
        return conflict(error, 'TOPIC_CONFLICT', 'Topic already exists in this subject')
      }
    },
    async update(actor: DomainStudent, id: string, input: { title?: string; archived?: boolean }) {
      const profile = await requireProfile(store, actor)
      if (!await store.findTopicById(profile.id, id)) {
        throw new ApiError(404, 'TOPIC_NOT_FOUND', 'Topic not found')
      }
      const titleData = input.title === undefined
        ? {}
        : {
            normalizedTitle: input.title.trim().toLocaleLowerCase(),
            title: input.title.trim(),
          }
      try {
        const result = await store.updateTopic(profile.id, id, {
          ...titleData,
          ...(input.archived === undefined
            ? {}
            : { archivedAt: input.archived ? now() : null }),
        })
        if (!result) throw new ApiError(404, 'TOPIC_NOT_FOUND', 'Topic not found')
        return result
      } catch (error) {
        return conflict(error, 'TOPIC_CONFLICT', 'Topic already exists in this subject')
      }
    },
  }

  const plans = {
    async list(actor: DomainStudent, query?: PageQuery & { status?: StudyPlanStatus }) {
      const profile = await requireProfile(store, actor)
      return page(await store.listPlans(profile.id, query), query)
    },
    async get(actor: DomainStudent, id: string) {
      const profile = await requireProfile(store, actor)
      const result = await store.findPlanById(profile.id, id)
      if (!result) throw new ApiError(404, 'PLAN_NOT_FOUND', 'Study plan not found')
      return result
    },
    async create(actor: DomainStudent, input: { title: string; description?: string | null; startsOn: string; endsOn: string | null }) {
      const profile = await requireProfile(store, actor)
      if (!validDate(input.startsOn) || (input.endsOn !== null && !validDate(input.endsOn))) throw new ApiError(400, 'PLAN_DATE_INVALID', 'Study plan dates are invalid')
      const startsOn = dateOnly(input.startsOn)
      const endsOn = input.endsOn === null ? null : dateOnly(input.endsOn)
      if (endsOn && endsOn < startsOn) throw new ApiError(400, 'PLAN_DATE_INVALID', 'Study plan end date precedes start date')
      return store.createPlan({ studentProfileId: profile.id, title: input.title.trim(), description: input.description ?? null, status: 'DRAFT', startsOn, endsOn })
    },
    async update(actor: DomainStudent, id: string, input: { title?: string; description?: string | null; status?: StudyPlanStatus; startsOn?: string; endsOn?: string | null }) {
      const profile = await requireProfile(store, actor)
      const current = await store.findPlanById(profile.id, id)
      if (!current) throw new ApiError(404, 'PLAN_NOT_FOUND', 'Study plan not found')
      if (input.startsOn !== undefined && !validDate(input.startsOn)) throw new ApiError(400, 'PLAN_DATE_INVALID', 'Study plan dates are invalid')
      if (input.endsOn !== undefined && input.endsOn !== null && !validDate(input.endsOn)) throw new ApiError(400, 'PLAN_DATE_INVALID', 'Study plan dates are invalid')
      const startsOn = input.startsOn === undefined ? current.startsOn : dateOnly(input.startsOn)
      const endsOn = input.endsOn === undefined ? current.endsOn : input.endsOn === null ? null : dateOnly(input.endsOn)
      if (endsOn && endsOn < startsOn) throw new ApiError(400, 'PLAN_DATE_INVALID', 'Study plan end date precedes start date')
      const result = await store.updatePlan(profile.id, id, {
        ...(input.title === undefined ? {} : { title: input.title.trim() }),
        ...(input.description === undefined ? {} : { description: input.description }),
        ...(input.status === undefined ? {} : { status: input.status }),
        ...(input.startsOn === undefined ? {} : { startsOn }),
        ...(input.endsOn === undefined ? {} : { endsOn }),
      })
      if (!result) throw new ApiError(404, 'PLAN_NOT_FOUND', 'Study plan not found')
      return result
    },
  }

  const tasks = {
    async list(actor: DomainStudent, query?: PageQuery & { scheduledFor?: string; scheduledFrom?: string; scheduledTo?: string; status?: DailyTaskStatus; studyPlanId?: string; subjectId?: string }) {
      const profile = await requireProfile(store, actor)
      if (query?.scheduledFor && !validDate(query.scheduledFor)) {
        throw new ApiError(400, 'TASK_DATE_INVALID', 'Task date is invalid')
      }
      if (query?.scheduledFrom && !validDate(query.scheduledFrom)) {
        throw new ApiError(400, 'TASK_DATE_INVALID', 'Task date range is invalid')
      }
      if (query?.scheduledTo && !validDate(query.scheduledTo)) {
        throw new ApiError(400, 'TASK_DATE_INVALID', 'Task date range is invalid')
      }
      if ((query?.scheduledFrom === undefined) !== (query?.scheduledTo === undefined)) {
        throw new ApiError(400, 'TASK_DATE_RANGE_INVALID', 'Task date range is invalid')
      }
      if (query?.scheduledFor && (query.scheduledFrom || query.scheduledTo)) {
        throw new ApiError(400, 'TASK_DATE_RANGE_INVALID', 'Task date cannot be combined with a range')
      }
      const scheduledFrom = query?.scheduledFrom ? dateOnly(query.scheduledFrom) : undefined
      const scheduledTo = query?.scheduledTo ? dateOnly(query.scheduledTo) : undefined
      if (scheduledFrom && scheduledTo && scheduledTo < scheduledFrom) {
        throw new ApiError(400, 'TASK_DATE_RANGE_INVALID', 'Task date range is invalid')
      }
      const {
        scheduledFor: scheduledForInput,
        scheduledFrom: _scheduledFromInput,
        scheduledTo: _scheduledToInput,
        ...storeQuery
      } = query ?? {}
      const records = await store.listTasks(profile.id, {
        ...storeQuery,
        ...(scheduledForInput ? { scheduledFor: dateOnly(scheduledForInput) } : {}),
        ...(scheduledFrom ? { scheduledFrom } : {}),
        ...(scheduledTo ? { scheduledTo } : {}),
      })
      return page(records.map(toTaskView), query)
    },
    async get(actor: DomainStudent, id: string) {
      const profile = await requireProfile(store, actor)
      const result = await store.findTaskById(profile.id, id)
      if (!result) throw new ApiError(404, 'TASK_NOT_FOUND', 'Daily task not found')
      return toTaskView(result)
    },
    async create(actor: DomainStudent, input: StudentTaskCreateInput) {
      const profile = await requireProfile(store, actor)
      validateTaskContent(input.contentType, input.subjectId, input.topicId, curriculumWriteItems(input))
      if (!validDate(input.scheduledFor)) throw new ApiError(400, 'TASK_DATE_INVALID', 'Task date is invalid')
      requireValidSchedule(input)
      if (input.studyPlanId && !await store.findPlanById(profile.id, input.studyPlanId)) throw new ApiError(404, 'PLAN_NOT_FOUND', 'Study plan not found')
      if (input.subjectId) {
        const subject = await store.findSubjectById(profile.id, input.subjectId)
        if (!subject) throw new ApiError(404, 'SUBJECT_NOT_FOUND', 'Study subject not found')
        if (subject.archivedAt) throw new ApiError(409, 'SUBJECT_ARCHIVED', 'Archived subjects cannot be assigned to new tasks')
      }
      await requireTaskTopicConsistency(store, profile.id, input.subjectId, input.topicId)
      const resolvedTargets = curriculumWriteItems(input).length > 0
        ? resolveNewTaskCurriculum(requireCurriculum(curriculum), profile.track ?? null, input)
        : []
      if (input.status === 'PARTIAL' || (resolvedTargets.length > 0 && input.status === 'COMPLETED')) {
        throw new ApiError(409, 'TASK_OUTCOME_INVALID', 'New Curriculum tasks have no completed execution items')
      }
      const {
        curriculumTargets: _curriculumTargets,
        curriculumSelection: _curriculumSelection,
        ...taskInput
      } = input
      const result = await store.createTask({
        ...taskInput,
        contentType: input.contentType ?? null,
        completedAt: input.status === 'COMPLETED' ? now() : null,
        partialAt: null,
        createdByUserId: actor.id,
        description: input.description ?? null,
        plannedTestCount: 0,
        scheduledFor: dateOnly(input.scheduledFor),
        startMinuteOfDay: input.startMinuteOfDay ?? null,
        endMinuteOfDay: input.endMinuteOfDay ?? null,
        source: 'PERSONAL',
        skipReason: input.status === 'SKIPPED' ? input.skipReason ?? null : null,
        skippedAt: input.status === 'SKIPPED' ? now() : null,
        studentProfileId: profile.id,
      }, resolvedTargets, profile.track ?? null)
      return toTaskView(result)
    },
    async update(actor: DomainStudent, id: string, input: { studyPlanId?: string | null; subjectId?: string | null; topicId?: string | null; title?: string; description?: string | null; estimatedMinutes?: number | null; status?: DailyTaskStatus; skipReason?: DailyTaskSkipReason | null }) {
      const profile = await requireProfile(store, actor)
      const current = await store.findTaskById(profile.id, id)
      if (!current) throw new ApiError(404, 'TASK_NOT_FOUND', 'Daily task not found')
      if (current.contentType && (input.subjectId || input.topicId)) {
        throw new ApiError(409, 'TASK_LEGACY_LINK_FORBIDDEN', 'Explicit task content types cannot use legacy Subject or Topic links')
      }
      if (
        current.source === 'COUNSELOR'
        && plannedTaskFields.some((field) => input[field] !== undefined)
      ) {
        throw new ApiError(403, 'TASK_UPDATE_FORBIDDEN', 'Counselor-created task content cannot be changed by students')
      }
      if (input.studyPlanId && !await store.findPlanById(profile.id, input.studyPlanId)) throw new ApiError(404, 'PLAN_NOT_FOUND', 'Study plan not found')
      if (input.subjectId) {
        const subject = await store.findSubjectById(profile.id, input.subjectId)
        if (!subject) throw new ApiError(404, 'SUBJECT_NOT_FOUND', 'Study subject not found')
        if (subject.archivedAt) throw new ApiError(409, 'SUBJECT_ARCHIVED', 'Archived subjects cannot be assigned to new tasks')
      }
      if (input.subjectId !== undefined || input.topicId !== undefined) {
        await requireTaskTopicConsistency(
          store,
          profile.id,
          input.subjectId === undefined ? current.subjectId : input.subjectId,
          input.topicId === undefined ? current.topicId : input.topicId,
        )
      }
      if (current.status === 'PARTIAL' && input.status !== undefined) {
        throw new ApiError(409, 'TASK_TERMINAL', 'PARTIAL tasks are closed')
      }
      if (input.status !== undefined) validateCurriculumOutcome(current, input.status)
      const lifecycleAt = input.status === undefined ? null : now()
      const update = {
        ...(input.studyPlanId === undefined ? {} : { studyPlanId: input.studyPlanId }),
        ...(input.subjectId === undefined ? {} : { subjectId: input.subjectId }),
        ...(input.topicId === undefined ? {} : { topicId: input.topicId }),
        ...(input.title === undefined ? {} : { title: input.title.trim() }),
        ...(input.description === undefined ? {} : { description: input.description }),
        ...(input.estimatedMinutes === undefined ? {} : { estimatedMinutes: input.estimatedMinutes }),
        ...(input.status === undefined ? {} : { status: input.status }),
        ...(input.status === undefined ? {} : { completedAt: input.status === 'COMPLETED' ? lifecycleAt : null }),
        ...(input.status === undefined ? {} : { partialAt: input.status === 'PARTIAL' ? lifecycleAt : null }),
        ...(input.status === undefined ? {} : { skipReason: input.status === 'SKIPPED' ? input.skipReason ?? null : null }),
        ...(input.status === undefined ? {} : { skippedAt: input.status === 'SKIPPED' ? lifecycleAt : null }),
      }
      if (input.status === 'COMPLETED' || input.status === 'PARTIAL' || input.status === 'SKIPPED') {
        const result = await store.updateTerminalTask(profile.id, id, update)
        if (!result.ok) {
          if (result.reason === 'ACTIVE_STUDY_SESSION_EXISTS') {
            throw new ApiError(409, 'TASK_ACTIVE_SESSION_EXISTS', 'Finish the active study session before changing task outcome')
          }
          throw new ApiError(404, 'TASK_NOT_FOUND', 'Daily task not found')
        }
        return toTaskView(result.value)
      }
      const result = await store.updateTask(profile.id, id, update)
      if (!result) throw new ApiError(404, 'TASK_NOT_FOUND', 'Daily task not found')
      return toTaskView(result)
    },
    async reschedule(actor: DomainStudent, id: string, input: RescheduleTaskInput) {
      const profile = await requireProfile(store, actor)
      if (input.scheduledFor !== undefined && !validDate(input.scheduledFor)) {
        throw new ApiError(400, 'TASK_DATE_INVALID', 'Task date is invalid')
      }
      requireValidSchedule(input)
      const result = await store.reschedulePersonalTask(
        profile.id,
        id,
        {
          ...(input.scheduledFor === undefined ? {} : { scheduledFor: dateOnly(input.scheduledFor) }),
          ...(input.startMinuteOfDay === undefined ? {} : { startMinuteOfDay: input.startMinuteOfDay }),
          ...(input.endMinuteOfDay === undefined ? {} : { endMinuteOfDay: input.endMinuteOfDay }),
        },
      )
      if (!result.ok) {
        switch (result.reason) {
          case 'TASK_NOT_FOUND':
            throw new ApiError(404, 'TASK_NOT_FOUND', 'Daily task not found')
          case 'TASK_SOURCE_FORBIDDEN':
            throw new ApiError(403, 'TASK_RESCHEDULE_FORBIDDEN', 'Counselor-created tasks cannot be rescheduled by students')
          case 'TASK_EXECUTED':
            throw new ApiError(409, 'TASK_ALREADY_EXECUTED', 'Tasks with recorded execution cannot be rescheduled')
        }
      }
      return toTaskView(result.value)
    },
    async replaceCurriculumTargets(
      actor: DomainStudent,
      id: string,
      input: CurriculumWriteInput,
    ) {
      const profile = await requireProfile(store, actor)
      const method = store.replacePersonalTaskCurriculumTargets
      if (!method) throw new ApiError(503, 'TASK_CURRICULUM_UNAVAILABLE', 'Task Curriculum persistence is unavailable')
      const current = await store.findTaskById(profile.id, id)
      if (!current) throw new ApiError(404, 'TASK_NOT_FOUND', 'Daily task not found')
      validateTaskContent(
        current.contentType,
        current.subjectId,
        current.topicId,
        curriculumWriteItems(input),
      )
      const targets = curriculumWriteItems(input).length > 0
        ? resolveNewTaskCurriculum(requireCurriculum(curriculum), profile.track ?? null, input)
        : []
      const result = await method(profile.id, id, targets, profile.track ?? null)
      if (!result.ok) {
        if (result.reason === 'TASK_NOT_FOUND') throw new ApiError(404, 'TASK_NOT_FOUND', 'Daily task not found')
        if (result.reason === 'TASK_SOURCE_FORBIDDEN') throw new ApiError(403, 'TASK_UPDATE_FORBIDDEN', 'Counselor-created task targets cannot be changed by students')
        if (result.reason === 'TASK_NOT_PENDING') throw new ApiError(409, 'TASK_TERMINAL', 'Curriculum targets are immutable after task closure')
        if (result.reason === 'TASK_GENERAL_TARGET_FORBIDDEN') throw new ApiError(409, result.reason, 'General tasks cannot have Curriculum targets')
        if (result.reason === 'TASK_STUDY_TARGET_REQUIRED') throw new ApiError(409, result.reason, 'Study tasks require a Curriculum target')
        throw new ApiError(409, 'TASK_CURRICULUM_EXECUTION_STARTED', 'Curriculum targets are immutable after execution starts')
      }
      return toTaskView(result.value)
    },
    async toggleCurriculumItem(
      actor: DomainStudent,
      taskId: string,
      itemId: string,
      input: { completed: boolean },
    ) {
      const profile = await requireProfile(store, actor)
      const method = store.toggleTaskCurriculumItem
      if (!method) throw new ApiError(503, 'TASK_CURRICULUM_UNAVAILABLE', 'Task Curriculum persistence is unavailable')
      const result = await method(profile.id, taskId, itemId, input.completed ? now() : null)
      if (!result.ok) {
        if (result.reason === 'TASK_NOT_FOUND') throw new ApiError(404, 'TASK_NOT_FOUND', 'Daily task not found')
        if (result.reason === 'TASK_NOT_PENDING') throw new ApiError(409, 'TASK_TERMINAL', 'Closed task execution cannot be changed')
        throw new ApiError(404, 'CURRICULUM_ITEM_NOT_FOUND', 'Task Curriculum item not found')
      }
      return toTaskView(result.value)
    },
  }

  return { subjects, topics, plans, tasks }
}

export type StudentCoreServices = ReturnType<typeof createStudentCoreServices>
export type { StudentCoreStore } from './store.js'
