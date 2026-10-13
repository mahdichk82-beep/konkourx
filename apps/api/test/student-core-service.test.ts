import assert from 'node:assert/strict'
import test from 'node:test'
import { ApiError } from '../src/errors/api-error.js'
import { createStudentCoreServices, type StudentCoreStore } from '../src/student-core/services.js'
import type {
  DailyTaskRecord,
  DomainStudent,
  StudyPlanRecord,
  StudySubjectRecord,
  TopicRecord,
} from '../src/student-core/types.js'

const student: DomainStudent = {
  id: 'student-user-1',
  role: 'STUDENT',
  status: 'ACTIVE',
}

const profile = { id: 'student-profile-1', userId: student.id }
const timestamp = new Date('2026-09-03T00:00:00.000Z')

const createStore = (): StudentCoreStore & {
  executedTaskIds: Set<string>
  activeTaskIds: Set<string>
  subjects: StudySubjectRecord[]
  topics: TopicRecord[]
  plans: StudyPlanRecord[]
  tasks: DailyTaskRecord[]
} => {
  const store = {
    executedTaskIds: new Set<string>(),
    activeTaskIds: new Set<string>(),
    subjects: [] as StudySubjectRecord[],
    topics: [] as TopicRecord[],
    plans: [] as StudyPlanRecord[],
    tasks: [] as DailyTaskRecord[],
    async findStudentProfileByUserId(userId: string) {
      return userId === profile.userId ? profile : null
    },
    async listSubjects() { return store.subjects },
    async findSubjectById(profileId: string, id: string) {
      return store.subjects.find((subject) => subject.id === id && subject.studentProfileId === profileId) ?? null
    },
    async createSubject(input: { studentProfileId: string; name: string; normalizedName: string }) {
      const record = { id: `subject-${store.subjects.length + 1}`, ...input, archivedAt: null, createdAt: timestamp, updatedAt: timestamp }
      store.subjects.push(record)
      return record
    },
    async updateSubject(profileId: string, id: string, input: { name?: string; normalizedName?: string; archivedAt?: Date | null }) {
      const subject = store.subjects.find((item) => item.id === id && item.studentProfileId === profileId)
      if (!subject) return null
      Object.assign(subject, input, { updatedAt: timestamp })
      return subject
    },
    async listTopics(profileId: string, subjectId: string) {
      const ownedSubjectIds = new Set(
        store.subjects
          .filter((subject) => subject.studentProfileId === profileId)
          .map((subject) => subject.id),
      )
      return store.topics.filter((topic) => topic.subjectId === subjectId && ownedSubjectIds.has(topic.subjectId))
    },
    async findTopicById(profileId: string, id: string) {
      const topic = store.topics.find((item) => item.id === id)
      if (!topic) return null
      return store.subjects.some((subject) =>
        subject.id === topic.subjectId && subject.studentProfileId === profileId,
      ) ? topic : null
    },
    async createTopic(input: { subjectId: string; title: string; normalizedTitle: string }) {
      const record = { id: `topic-${store.topics.length + 1}`, ...input, archivedAt: null, createdAt: timestamp, updatedAt: timestamp }
      store.topics.push(record)
      return record
    },
    async updateTopic(profileId: string, id: string, input: { title?: string; normalizedTitle?: string; archivedAt?: Date | null }) {
      const topic = await store.findTopicById(profileId, id)
      if (!topic) return null
      Object.assign(topic, input, { updatedAt: timestamp })
      return topic
    },
    async listPlans() { return store.plans },
    async findPlanById(profileId: string, id: string) { return store.plans.find((plan) => plan.id === id && plan.studentProfileId === profileId) ?? null },
    async createPlan(input: Omit<StudyPlanRecord, 'id' | 'createdAt' | 'updatedAt'>) {
      const record = { id: `plan-${store.plans.length + 1}`, ...input, createdAt: timestamp, updatedAt: timestamp }
      store.plans.push(record)
      return record
    },
    async updatePlan(profileId: string, id: string, input: Partial<Pick<StudyPlanRecord, 'title' | 'description' | 'status' | 'startsOn' | 'endsOn'>>) {
      const plan = store.plans.find((item) => item.id === id && item.studentProfileId === profileId)
      if (!plan) return null
      Object.assign(plan, input, { updatedAt: timestamp })
      return plan
    },
    async listTasks() { return store.tasks },
    async findTaskById(profileId: string, id: string) { return store.tasks.find((task) => task.id === id && task.studentProfileId === profileId) ?? null },
    async createTask(input: Omit<DailyTaskRecord, 'id' | 'createdAt' | 'updatedAt'>) {
      const record = { id: `task-${store.tasks.length + 1}`, ...input, createdAt: timestamp, updatedAt: timestamp }
      store.tasks.push(record)
      return record
    },
    async updateTask(profileId: string, id: string, input: Partial<Pick<DailyTaskRecord, 'studyPlanId' | 'subjectId' | 'topicId' | 'title' | 'description' | 'estimatedMinutes' | 'status' | 'completedAt' | 'skipReason' | 'skippedAt'>>) {
      const task = store.tasks.find((item) => item.id === id && item.studentProfileId === profileId)
      if (!task) return null
      Object.assign(task, input, { updatedAt: timestamp })
      return task
    },
    async updateTerminalTask(profileId: string, id: string, input: Partial<Pick<DailyTaskRecord, 'studyPlanId' | 'subjectId' | 'topicId' | 'title' | 'description' | 'estimatedMinutes' | 'status' | 'completedAt' | 'skipReason' | 'skippedAt'>>) {
      const task = store.tasks.find((item) => item.id === id && item.studentProfileId === profileId)
      if (!task) return { ok: false as const, reason: 'TASK_NOT_FOUND' as const }
      if (store.activeTaskIds.has(id)) {
        return { ok: false as const, reason: 'ACTIVE_STUDY_SESSION_EXISTS' as const }
      }
      Object.assign(task, input, { updatedAt: timestamp })
      return { ok: true as const, value: task }
    },
    async updateTaskProgress() {
      return { ok: false as const, reason: 'TASK_NOT_FOUND' as const }
    },
    async reschedulePersonalTask(profileId: string, id: string, schedule: Partial<DailyTaskRecord>) {
      const task = store.tasks.find((item) => item.id === id && item.studentProfileId === profileId)
      if (!task) return { ok: false as const, reason: 'TASK_NOT_FOUND' as const }
      if (task.source !== 'PERSONAL') {
        return { ok: false as const, reason: 'TASK_SOURCE_FORBIDDEN' as const }
      }
      if (store.executedTaskIds.has(id)) {
        return { ok: false as const, reason: 'TASK_EXECUTED' as const }
      }
      Object.assign(task, schedule)
      task.updatedAt = timestamp
      return { ok: true as const, value: task }
    },
  }
  return store
}

const prismaPage = <T extends { id: string }>(
  items: T[],
  query?: { cursor?: string; limit?: number },
): T[] => {
  const start = query?.cursor
    ? Math.max(items.findIndex((item) => item.id === query.cursor) + 1, 0)
    : 0
  return items.slice(start, start + (query?.limit ?? 50) + 1)
}

test('student core creates normalized subjects and rejects duplicate ownership', async () => {
  const store = createStore()
  const services = createStudentCoreServices(store, () => timestamp)
  const subject = await services.subjects.create(student, { name: '  Mathematics  ' })

  assert.equal(subject.name, 'Mathematics')
  assert.equal(subject.normalizedName, 'mathematics')

  store.createSubject = async () => {
    throw { code: 'P2002' }
  }
  await assert.rejects(
    services.subjects.create(student, { name: 'mathematics' }),
    (error: unknown) => error instanceof ApiError && error.code === 'SUBJECT_CONFLICT',
  )
})

test('student core creates normalized topics and rejects duplicate names in a subject', async () => {
  const store = createStore()
  store.subjects.push({
    id: 'subject-1',
    studentProfileId: profile.id,
    name: 'Mathematics',
    normalizedName: 'mathematics',
    archivedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  const services = createStudentCoreServices(store, () => timestamp)

  const topic = await services.topics.create(student, 'subject-1', { title: '  Functions  ' })
  assert.equal(topic.title, 'Functions')
  assert.equal(topic.normalizedTitle, 'functions')
  assert.equal(topic.subjectId, 'subject-1')

  store.createTopic = async () => {
    throw { code: 'P2002' }
  }
  await assert.rejects(
    services.topics.create(student, 'subject-1', { title: 'functions' }),
    (error: unknown) => error instanceof ApiError && error.code === 'TOPIC_CONFLICT',
  )
})

test('student core hides foreign subjects and topics from topic operations', async () => {
  const store = createStore()
  store.subjects.push({
    id: 'foreign-subject',
    studentProfileId: 'student-profile-2',
    name: 'Private subject',
    normalizedName: 'private subject',
    archivedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  store.topics.push({
    id: 'foreign-topic',
    subjectId: 'foreign-subject',
    title: 'Private topic',
    normalizedTitle: 'private topic',
    archivedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  const services = createStudentCoreServices(store, () => timestamp)

  await assert.rejects(
    services.topics.list(student, 'foreign-subject'),
    (error: unknown) => error instanceof ApiError && error.code === 'SUBJECT_NOT_FOUND',
  )
  await assert.rejects(
    services.topics.create(student, 'foreign-subject', { title: 'Escalated topic' }),
    (error: unknown) => error instanceof ApiError && error.code === 'SUBJECT_NOT_FOUND',
  )
  await assert.rejects(
    services.topics.update(student, 'foreign-topic', { title: 'Changed' }),
    (error: unknown) => error instanceof ApiError && error.code === 'TOPIC_NOT_FOUND',
  )
  assert.equal(store.topics[0]?.title, 'Private topic')
})

test('student core rejects an invalid subject for topic creation', async () => {
  const services = createStudentCoreServices(createStore(), () => timestamp)

  await assert.rejects(
    services.topics.create(student, 'missing-subject', { title: 'Functions' }),
    (error: unknown) => error instanceof ApiError && error.code === 'SUBJECT_NOT_FOUND',
  )
})

test('student core renames and archives only an owned topic', async () => {
  const store = createStore()
  store.subjects.push({
    id: 'subject-1',
    studentProfileId: profile.id,
    name: 'Physics',
    normalizedName: 'physics',
    archivedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  store.topics.push({
    id: 'topic-1',
    subjectId: 'subject-1',
    title: 'Motion',
    normalizedTitle: 'motion',
    archivedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  const services = createStudentCoreServices(store, () => timestamp)

  const renamed = await services.topics.update(student, 'topic-1', { title: '  Dynamics  ' })
  assert.equal(renamed.title, 'Dynamics')
  assert.equal(renamed.normalizedTitle, 'dynamics')

  const archived = await services.topics.update(student, 'topic-1', { archived: true })
  assert.deepEqual(archived.archivedAt, timestamp)
})

test('student core rejects plans whose end date precedes the start date', async () => {
  const store = createStore()
  const services = createStudentCoreServices(store, () => timestamp)

  await assert.rejects(
    services.plans.create(student, {
      title: 'Exam preparation',
      description: null,
      startsOn: '2026-09-10',
      endsOn: '2026-09-01',
    }),
    (error: unknown) => error instanceof ApiError && error.code === 'PLAN_DATE_INVALID',
  )
})

test('student lifecycle records skip metadata and preserves completion timestamp behavior', async () => {
  const store = createStore()
  const services = createStudentCoreServices(store, () => timestamp)
  const task = await services.tasks.create(student, {
    title: 'Read chapter one',
    description: null,
    scheduledFor: '2026-09-03',
    estimatedMinutes: 30,
    status: 'PENDING',
    studyPlanId: null,
    subjectId: null,
    topicId: null,
  })

  const updated = await services.tasks.update(student, task.id, { status: 'COMPLETED' })
  assert.equal(updated.status, 'COMPLETED')
  assert.deepEqual(updated.completedAt, timestamp)
  assert.equal(updated.skipReason, null)
  assert.equal(updated.skippedAt, null)

  const originalProvenance = {
    createdByUserId: store.tasks[0]?.createdByUserId,
    source: store.tasks[0]?.source,
    studentProfileId: store.tasks[0]?.studentProfileId,
  }
  const skipped = await services.tasks.update(student, task.id, {
    status: 'SKIPPED',
    skipReason: 'NO_TIME',
  })
  assert.equal(skipped.status, 'SKIPPED')
  assert.equal(skipped.completedAt, null)
  assert.equal(skipped.skipReason, 'NO_TIME')
  assert.deepEqual(skipped.skippedAt, timestamp)
  assert.deepEqual({
    createdByUserId: store.tasks[0]?.createdByUserId,
    source: store.tasks[0]?.source,
    studentProfileId: store.tasks[0]?.studentProfileId,
  }, originalProvenance)

  const reopened = await services.tasks.update(student, task.id, { status: 'PENDING' })
  assert.equal(reopened.status, 'PENDING')
  assert.equal(reopened.completedAt, null)
  assert.equal(reopened.skipReason, null)
  assert.equal(reopened.skippedAt, null)

  await assert.rejects(
    services.tasks.get({ id: 'other-student', role: 'STUDENT', status: 'ACTIVE' }, task.id),
    (error: unknown) => error instanceof ApiError && error.code === 'STUDENT_PROFILE_REQUIRED',
  )
})

test('an active linked study session blocks terminal task outcomes without choosing an outcome', async () => {
  const store = createStore()
  const services = createStudentCoreServices(store, () => timestamp)
  const task = await services.tasks.create(student, {
    title: 'Active task',
    description: null,
    scheduledFor: '2026-09-03',
    estimatedMinutes: 30,
    status: 'PENDING',
    studyPlanId: null,
    subjectId: null,
    topicId: null,
  })
  store.activeTaskIds.add(task.id)

  for (const status of ['COMPLETED', 'SKIPPED'] as const) {
    await assert.rejects(
      services.tasks.update(student, task.id, { status }),
      (error: unknown) => error instanceof ApiError && error.code === 'TASK_ACTIVE_SESSION_EXISTS',
    )
  }
  assert.equal(store.tasks[0]?.status, 'PENDING')

  store.activeTaskIds.delete(task.id)
  const completed = await services.tasks.update(student, task.id, {
    status: 'COMPLETED',
  })
  assert.equal(completed.status, 'COMPLETED')
})

test('student task provenance is server-assigned, immutable, and creator-safe in responses', async () => {
  const store = createStore()
  const services = createStudentCoreServices(store, () => timestamp)
  const forgedCreateInput = {
    title: 'Personal task',
    description: null,
    scheduledFor: '2026-09-03',
    estimatedMinutes: 30,
    status: 'PENDING',
    studyPlanId: null,
    subjectId: null,
    topicId: null,
    source: 'COUNSELOR',
    createdByUserId: 'another-user',
    studentProfileId: 'another-profile',
  } as unknown as Parameters<typeof services.tasks.create>[1]

  const task = await services.tasks.create(student, forgedCreateInput)

  assert.equal(task.source, 'PERSONAL')
  assert.equal('createdByUserId' in task, false)
  assert.equal(store.tasks[0]?.studentProfileId, profile.id)
  assert.equal(store.tasks[0]?.createdByUserId, student.id)
  assert.equal(store.tasks[0]?.source, 'PERSONAL')

  const fetched = await services.tasks.get(student, task.id)
  const listed = await services.tasks.list(student)
  assert.equal(fetched.source, 'PERSONAL')
  assert.equal('createdByUserId' in fetched, false)
  assert.equal(listed.items[0]?.source, 'PERSONAL')
  assert.equal('createdByUserId' in (listed.items[0] ?? {}), false)

  const forgedUpdateInput = {
    status: 'COMPLETED',
    source: 'COUNSELOR',
    createdByUserId: 'another-user',
    studentProfileId: 'another-profile',
  } as unknown as Parameters<typeof services.tasks.update>[2]
  const updated = await services.tasks.update(student, task.id, forgedUpdateInput)

  assert.equal(updated.source, 'PERSONAL')
  assert.equal('createdByUserId' in updated, false)
  assert.equal(store.tasks[0]?.studentProfileId, profile.id)
  assert.equal(store.tasks[0]?.createdByUserId, student.id)
  assert.equal(store.tasks[0]?.source, 'PERSONAL')
})

test('student task views expose immutable deadline evidence but hide eligibility bookkeeping', async () => {
  const store = createStore()
  const services = createStudentCoreServices(store, () => timestamp)
  const created = await services.tasks.create(student, {
    title: 'Historical task',
    description: null,
    scheduledFor: '2026-09-03',
    estimatedMinutes: 30,
    status: 'PENDING',
    studyPlanId: null,
    subjectId: null,
    topicId: null,
  })
  const record = store.tasks[0] as DailyTaskRecord & {
    deadlineEligibilityStartedAt: Date
    deadlineMisses: Array<{
      deadlineAt: Date
      id: string
      recordedAt: Date
      scheduledFor: Date
    }>
  }
  record.deadlineEligibilityStartedAt = timestamp
  record.deadlineMisses = [{
    deadlineAt: new Date('2026-09-03T20:30:00.000Z'),
    id: 'deadline-miss-1',
    recordedAt: new Date('2026-09-03T20:35:00.000Z'),
    scheduledFor: new Date('2026-09-03T00:00:00.000Z'),
  }]

  const view = await services.tasks.get(student, created.id)

  assert.deepEqual(view.deadlineMisses, [{
    deadlineAt: new Date('2026-09-03T20:30:00.000Z'),
    recordedAt: new Date('2026-09-03T20:35:00.000Z'),
    scheduledFor: new Date('2026-09-03T00:00:00.000Z'),
  }])
  assert.equal('deadlineEligibilityStartedAt' in view, false)
  assert.equal('id' in view.deadlineMisses[0]!, false)
})

test('student reschedules only an unexecuted owned personal task without changing provenance', async () => {
  const store = createStore()
  const services = createStudentCoreServices(store, () => timestamp)
  const personal = await services.tasks.create(student, {
    title: 'Personal task',
    description: null,
    scheduledFor: '2026-09-03',
    estimatedMinutes: 30,
    status: 'PENDING',
    studyPlanId: null,
    subjectId: null,
    topicId: null,
  })
  const original = { ...store.tasks[0] }

  const moved = await services.tasks.reschedule(student, personal.id, {
    scheduledFor: '2026-09-04',
  })
  assert.equal(moved.scheduledFor.toISOString(), '2026-09-04T00:00:00.000Z')
  assert.equal(store.tasks[0]?.studentProfileId, original.studentProfileId)
  assert.equal(store.tasks[0]?.createdByUserId, original.createdByUserId)
  assert.equal(store.tasks[0]?.source, original.source)
  assert.equal('createdByUserId' in moved, false)

  store.tasks.push({
    ...original,
    id: 'counselor-task',
    createdByUserId: 'counselor-user',
    source: 'COUNSELOR',
  })
  await assert.rejects(
    services.tasks.reschedule(student, 'counselor-task', { scheduledFor: '2026-09-05' }),
    (error: unknown) => error instanceof ApiError && error.code === 'TASK_RESCHEDULE_FORBIDDEN',
  )

  store.executedTaskIds.add(personal.id)
  await assert.rejects(
    services.tasks.reschedule(student, personal.id, { scheduledFor: '2026-09-06' }),
    (error: unknown) => error instanceof ApiError && error.code === 'TASK_ALREADY_EXECUTED',
  )
  await assert.rejects(
    services.tasks.reschedule(student, 'foreign-task', { scheduledFor: '2026-09-06' }),
    (error: unknown) => error instanceof ApiError && error.code === 'TASK_NOT_FOUND',
  )
})

test('student cannot change counselor-created planned content but can update its status', async () => {
  const store = createStore()
  store.tasks.push({
    id: 'counselor-task',
    studentProfileId: profile.id,
    createdByUserId: 'counselor-user',
    source: 'COUNSELOR',
    studyPlanId: null,
    subjectId: null,
    topicId: null,
    title: 'Counselor plan',
    description: null,
    scheduledFor: timestamp,
    estimatedMinutes: 30,
    status: 'PENDING',
    completedAt: null,
    skipReason: null,
    skippedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  const services = createStudentCoreServices(store, () => timestamp)

  await assert.rejects(
    services.tasks.update(student, 'counselor-task', { title: 'Changed by student' }),
    (error: unknown) => error instanceof ApiError && error.code === 'TASK_UPDATE_FORBIDDEN',
  )
  const completed = await services.tasks.update(student, 'counselor-task', {
    status: 'COMPLETED',
  })
  assert.equal(completed.status, 'COMPLETED')
  assert.equal(store.tasks[0]?.title, 'Counselor plan')
  const skipped = await services.tasks.update(student, 'counselor-task', {
    status: 'SKIPPED',
    skipReason: 'TOO_DIFFICULT',
  })
  assert.equal(skipped.skipReason, 'TOO_DIFFICULT')
  assert.equal(store.tasks[0]?.createdByUserId, 'counselor-user')
  assert.equal(store.tasks[0]?.source, 'COUNSELOR')
  assert.equal(store.tasks[0]?.title, 'Counselor plan')
})

test('student core creates tasks with no topic or a valid owned subject topic', async () => {
  const store = createStore()
  store.subjects.push({
    id: 'subject-1',
    studentProfileId: profile.id,
    name: 'Biology',
    normalizedName: 'biology',
    archivedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  store.topics.push({
    id: 'topic-1',
    subjectId: 'subject-1',
    title: 'Genetics',
    normalizedTitle: 'genetics',
    archivedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  const services = createStudentCoreServices(store, () => timestamp)

  const withoutTopic = await services.tasks.create(student, {
    title: 'General review',
    description: null,
    scheduledFor: '2026-09-03',
    estimatedMinutes: 20,
    status: 'PENDING',
    studyPlanId: null,
    subjectId: null,
    topicId: null,
  })
  const withTopic = await services.tasks.create(student, {
    title: 'Review genetics',
    description: null,
    scheduledFor: '2026-09-03',
    estimatedMinutes: 30,
    status: 'PENDING',
    studyPlanId: null,
    subjectId: 'subject-1',
    topicId: 'topic-1',
  })

  assert.equal(withoutTopic.topicId, null)
  assert.equal(withTopic.subjectId, 'subject-1')
  assert.equal(withTopic.topicId, 'topic-1')
})

test('student core rejects mismatched and foreign topics during task creation', async () => {
  const store = createStore()
  store.subjects.push(
    {
      id: 'subject-1',
      studentProfileId: profile.id,
      name: 'Biology',
      normalizedName: 'biology',
      archivedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'subject-2',
      studentProfileId: profile.id,
      name: 'Chemistry',
      normalizedName: 'chemistry',
      archivedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'foreign-subject',
      studentProfileId: 'student-profile-2',
      name: 'Private subject',
      normalizedName: 'private subject',
      archivedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  )
  store.topics.push(
    {
      id: 'other-subject-topic',
      subjectId: 'subject-2',
      title: 'Atoms',
      normalizedTitle: 'atoms',
      archivedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'foreign-topic',
      subjectId: 'foreign-subject',
      title: 'Private topic',
      normalizedTitle: 'private topic',
      archivedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  )
  const services = createStudentCoreServices(store, () => timestamp)
  const taskInput = {
    title: 'Invalid topic task',
    description: null,
    scheduledFor: '2026-09-03',
    estimatedMinutes: null,
    status: 'PENDING' as const,
    studyPlanId: null,
    subjectId: 'subject-1',
  }

  await assert.rejects(
    services.tasks.create(student, { ...taskInput, topicId: 'other-subject-topic' }),
    (error: unknown) => error instanceof ApiError && error.code === 'TOPIC_SUBJECT_MISMATCH',
  )
  await assert.rejects(
    services.tasks.create(student, { ...taskInput, topicId: 'foreign-topic' }),
    (error: unknown) => error instanceof ApiError && error.code === 'TOPIC_NOT_FOUND',
  )
  await assert.rejects(
    services.tasks.create(student, {
      ...taskInput,
      subjectId: null,
      topicId: 'other-subject-topic',
    }),
    (error: unknown) => error instanceof ApiError && error.code === 'TOPIC_SUBJECT_REQUIRED',
  )
  assert.equal(store.tasks.length, 0)
})

test('student core attaches only a valid topic during task update', async () => {
  const store = createStore()
  store.subjects.push(
    {
      id: 'subject-1',
      studentProfileId: profile.id,
      name: 'Biology',
      normalizedName: 'biology',
      archivedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'subject-2',
      studentProfileId: profile.id,
      name: 'Chemistry',
      normalizedName: 'chemistry',
      archivedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  )
  store.topics.push(
    {
      id: 'topic-1',
      subjectId: 'subject-1',
      title: 'Genetics',
      normalizedTitle: 'genetics',
      archivedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'topic-2',
      subjectId: 'subject-2',
      title: 'Atoms',
      normalizedTitle: 'atoms',
      archivedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  )
  const services = createStudentCoreServices(store, () => timestamp)
  const task = await services.tasks.create(student, {
    title: 'Biology review',
    description: null,
    scheduledFor: '2026-09-03',
    estimatedMinutes: null,
    status: 'PENDING',
    studyPlanId: null,
    subjectId: 'subject-1',
    topicId: null,
  })

  const attached = await services.tasks.update(student, task.id, { topicId: 'topic-1' })
  assert.equal(attached.topicId, 'topic-1')

  await assert.rejects(
    services.tasks.update(student, task.id, { topicId: 'topic-2' }),
    (error: unknown) => error instanceof ApiError && error.code === 'TOPIC_SUBJECT_MISMATCH',
  )
  await assert.rejects(
    services.tasks.update(student, task.id, { subjectId: null }),
    (error: unknown) => error instanceof ApiError && error.code === 'TOPIC_SUBJECT_REQUIRED',
  )
  assert.equal(store.tasks[0]?.topicId, 'topic-1')
})

test('student core hides another student task from get and update operations', async () => {
  const store = createStore()
  store.tasks.push({
    id: 'foreign-task',
    studentProfileId: 'student-profile-2',
    createdByUserId: 'student-user-2',
    source: 'PERSONAL',
    studyPlanId: null,
    subjectId: null,
    topicId: null,
    title: 'Private task',
    description: null,
    scheduledFor: timestamp,
    estimatedMinutes: 20,
    status: 'PENDING',
    completedAt: null,
    skipReason: null,
    skippedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  const services = createStudentCoreServices(store, () => timestamp)

  await assert.rejects(
    services.tasks.get(student, 'foreign-task'),
    (error: unknown) => error instanceof ApiError && error.code === 'TASK_NOT_FOUND',
  )
  await assert.rejects(
    services.tasks.update(student, 'foreign-task', {
      status: 'SKIPPED',
      skipReason: 'FORGOT',
    }),
    (error: unknown) => error instanceof ApiError && error.code === 'TASK_NOT_FOUND',
  )
  assert.equal(store.tasks[0]?.status, 'PENDING')
})

test('student core rejects another student subject on task create and update', async () => {
  const store = createStore()
  store.subjects.push({
    id: 'foreign-subject',
    studentProfileId: 'student-profile-2',
    name: 'Private subject',
    normalizedName: 'private subject',
    archivedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  const services = createStudentCoreServices(store, () => timestamp)
  const task = await services.tasks.create(student, {
    title: 'Own task',
    description: null,
    scheduledFor: '2026-09-03',
    estimatedMinutes: null,
    status: 'PENDING',
    studyPlanId: null,
    subjectId: null,
    topicId: null,
  })

  await assert.rejects(
    services.tasks.create(student, {
      title: 'Invalid task',
      description: null,
      scheduledFor: '2026-09-03',
      estimatedMinutes: null,
      status: 'PENDING',
      studyPlanId: null,
      subjectId: 'foreign-subject',
      topicId: null,
    }),
    (error: unknown) => error instanceof ApiError && error.code === 'SUBJECT_NOT_FOUND',
  )
  await assert.rejects(
    services.tasks.update(student, task.id, { subjectId: 'foreign-subject' }),
    (error: unknown) => error instanceof ApiError && error.code === 'SUBJECT_NOT_FOUND',
  )
  assert.equal(store.tasks.length, 1)
  assert.equal(store.tasks[0]?.subjectId, null)
})

test('student core rejects another student study plan on task create and update', async () => {
  const store = createStore()
  store.plans.push({
    id: 'foreign-plan',
    studentProfileId: 'student-profile-2',
    title: 'Private plan',
    description: null,
    status: 'ACTIVE',
    startsOn: timestamp,
    endsOn: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  const services = createStudentCoreServices(store, () => timestamp)
  const task = await services.tasks.create(student, {
    title: 'Own task',
    description: null,
    scheduledFor: '2026-09-03',
    estimatedMinutes: null,
    status: 'PENDING',
    studyPlanId: null,
    subjectId: null,
    topicId: null,
  })

  await assert.rejects(
    services.tasks.create(student, {
      title: 'Invalid task',
      description: null,
      scheduledFor: '2026-09-03',
      estimatedMinutes: null,
      status: 'PENDING',
      studyPlanId: 'foreign-plan',
      subjectId: null,
      topicId: null,
    }),
    (error: unknown) => error instanceof ApiError && error.code === 'PLAN_NOT_FOUND',
  )
  await assert.rejects(
    services.tasks.update(student, task.id, { studyPlanId: 'foreign-plan' }),
    (error: unknown) => error instanceof ApiError && error.code === 'PLAN_NOT_FOUND',
  )
  assert.equal(store.tasks.length, 1)
  assert.equal(store.tasks[0]?.studyPlanId, null)
})

test('student core rejects archived subjects for new task assignments', async () => {
  const store = createStore()
  store.subjects.push({
    id: 'archived-subject',
    studentProfileId: profile.id,
    name: 'Archived subject',
    normalizedName: 'archived subject',
    archivedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
  const services = createStudentCoreServices(store, () => timestamp)

  await assert.rejects(
    services.tasks.create(student, {
      title: 'Invalid task',
      description: null,
      scheduledFor: '2026-09-03',
      estimatedMinutes: null,
      status: 'PENDING',
      studyPlanId: null,
      subjectId: 'archived-subject',
      topicId: null,
    }),
    (error: unknown) => error instanceof ApiError && error.code === 'SUBJECT_ARCHIVED',
  )
})

const progressTaskRecord = (
  overrides: Partial<DailyTaskRecord> = {},
): DailyTaskRecord => ({
  id: 'progress-task',
  studentProfileId: profile.id,
  createdByUserId: 'counselor-user-1',
  source: 'COUNSELOR',
  contentType: 'STUDY',
  studyPlanId: null,
  subjectId: null,
  topicId: null,
  title: 'Test practice',
  description: null,
  scheduledFor: timestamp,
  startMinuteOfDay: null,
  endMinuteOfDay: null,
  estimatedMinutes: 30,
  plannedTestCount: 20,
  actualSolvedTestCount: 0,
  status: 'PENDING',
  completedAt: null,
  partialAt: null,
  skipReason: null,
  skippedAt: null,
  createdAt: timestamp,
  updatedAt: timestamp,
  ...overrides,
})

test('student progress replaces the cumulative total and permits pending corrections on counselor tasks', async () => {
  const store = createStore()
  const task = progressTaskRecord()
  store.tasks.push(task)
  const writes: Array<{ count: number; expectedUpdatedAt: Date }> = []
  ;(store as StudentCoreStore & {
    updateTaskProgress(
      profileId: string,
      id: string,
      input: { actualSolvedTestCount: number; expectedUpdatedAt: Date },
    ): Promise<{ ok: true; value: DailyTaskRecord }>
  }).updateTaskProgress = async (profileId, id, input) => {
    assert.equal(profileId, profile.id)
    assert.equal(id, task.id)
    writes.push({ count: input.actualSolvedTestCount, expectedUpdatedAt: input.expectedUpdatedAt })
    task.actualSolvedTestCount = input.actualSolvedTestCount
    task.updatedAt = new Date(task.updatedAt.getTime() + 1_000)
    return { ok: true, value: task }
  }
  const services = createStudentCoreServices(store, () => timestamp)

  const first = await services.tasks.recordProgress(student, task.id, {
    actualSolvedTestCount: 14,
    expectedUpdatedAt: timestamp.toISOString(),
  })
  const corrected = await services.tasks.recordProgress(student, task.id, {
    actualSolvedTestCount: 11,
    expectedUpdatedAt: first.updatedAt.toISOString(),
  })

  assert.equal(first.actualSolvedTestCount, 14)
  assert.equal(corrected.actualSolvedTestCount, 11)
  assert.deepEqual(writes.map(({ count }) => count), [14, 11])
  assert.equal(corrected.source, 'COUNSELOR')
  assert.equal('createdByUserId' in corrected, false)
})

test('student progress rejects non-study and terminal task records', async () => {
  const store = createStore()
  const task = progressTaskRecord({ contentType: 'GENERAL' })
  store.tasks.push(task)
  const services = createStudentCoreServices(store, () => timestamp)
  const input = { actualSolvedTestCount: 4, expectedUpdatedAt: timestamp.toISOString() }

  await assert.rejects(
    services.tasks.recordProgress(student, task.id, input),
    (error: unknown) => error instanceof ApiError && error.code === 'TASK_PROGRESS_NOT_APPLICABLE',
  )
  task.contentType = null
  await assert.rejects(
    services.tasks.recordProgress(student, task.id, input),
    (error: unknown) => error instanceof ApiError && error.code === 'TASK_PROGRESS_NOT_APPLICABLE',
  )
  task.contentType = 'STUDY'
  task.status = 'PARTIAL'
  await assert.rejects(
    services.tasks.recordProgress(student, task.id, input),
    (error: unknown) => error instanceof ApiError && error.code === 'TASK_TERMINAL',
  )
})

test('student progress reports stale conditional writes without overwriting the authoritative total', async () => {
  const store = createStore()
  const task = progressTaskRecord({ actualSolvedTestCount: 8 })
  store.tasks.push(task)
  ;(store as StudentCoreStore & {
    updateTaskProgress(): Promise<{ ok: false; reason: 'TASK_PROGRESS_STALE' }>
  }).updateTaskProgress = async () => ({ ok: false, reason: 'TASK_PROGRESS_STALE' })
  const services = createStudentCoreServices(store, () => timestamp)

  await assert.rejects(
    services.tasks.recordProgress(student, task.id, {
      actualSolvedTestCount: 13,
      expectedUpdatedAt: timestamp.toISOString(),
    }),
    (error: unknown) => error instanceof ApiError && error.code === 'TASK_PROGRESS_STALE',
  )
  assert.equal(task.actualSolvedTestCount, 8)
})

test('student core plan and task pages use lookahead rows without repeating the cursor', async () => {
  const store = createStore()
  store.plans.push(
    ...['plan-1', 'plan-2', 'plan-3'].map((id, index): StudyPlanRecord => ({
      id,
      studentProfileId: profile.id,
      title: id,
      description: null,
      status: 'ACTIVE',
      startsOn: new Date(`2026-09-0${3 - index}T00:00:00.000Z`),
      endsOn: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
  )
  store.tasks.push(
    ...['task-1', 'task-2', 'task-3'].map((id, index): DailyTaskRecord => ({
      id,
      studentProfileId: profile.id,
      createdByUserId: student.id,
      source: 'PERSONAL',
      studyPlanId: null,
      subjectId: null,
      topicId: null,
      title: id,
      description: null,
      scheduledFor: new Date(`2026-09-0${3 - index}T00:00:00.000Z`),
      estimatedMinutes: null,
      status: 'PENDING',
      completedAt: null,
      skipReason: null,
      skippedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
  )
  store.listPlans = async (_profileId, query) => prismaPage(store.plans, query)
  store.listTasks = async (_profileId, query) => prismaPage(store.tasks, query)
  const services = createStudentCoreServices(store)

  const planPage1 = await services.plans.list(student, { limit: 2 })
  const planPage2 = await services.plans.list(student, { cursor: 'plan-2', limit: 2 })
  assert.deepEqual(planPage1.items.map(({ id }) => id), ['plan-1', 'plan-2'])
  assert.equal(planPage1.nextCursor, 'plan-2')
  assert.deepEqual(planPage2.items.map(({ id }) => id), ['plan-3'])
  assert.equal(planPage2.nextCursor, null)

  const taskPage1 = await services.tasks.list(student, { limit: 2 })
  const taskPage2 = await services.tasks.list(student, { cursor: 'task-2', limit: 2 })
  assert.deepEqual(taskPage1.items.map(({ id }) => id), ['task-1', 'task-2'])
  assert.equal(taskPage1.nextCursor, 'task-2')
  assert.deepEqual(taskPage2.items.map(({ id }) => id), ['task-3'])
  assert.equal(taskPage2.nextCursor, null)
})

test('student overdue query is bounded, paginated, and forces pending tasks before the exclusive date', async () => {
  const store = createStore()
  const received: Array<Parameters<StudentCoreStore['listTasks']>[1]> = []
  const records = [
    progressTaskRecord({
      createdAt: new Date('2026-09-03T09:00:00.000Z'),
      id: '00000000-0000-4000-8000-000000000121',
      scheduledFor: new Date('2026-09-03T00:00:00.000Z'),
    }),
    progressTaskRecord({
      createdAt: new Date('2026-09-02T09:00:00.000Z'),
      id: '00000000-0000-4000-8000-000000000122',
      scheduledFor: new Date('2026-09-02T00:00:00.000Z'),
    }),
    progressTaskRecord({
      createdAt: new Date('2026-09-01T09:00:00.000Z'),
      id: '00000000-0000-4000-8000-000000000123',
      scheduledFor: new Date('2026-09-01T00:00:00.000Z'),
    }),
  ]
  let call = 0
  store.listTasks = async (_profileId, query) => {
    received.push(query)
    call += 1
    return call === 1 ? records : [records[2]!]
  }
  const services = createStudentCoreServices(store, () => timestamp)

  const firstPage = await services.tasks.list(student, {
    limit: 2,
    overdueBefore: '2026-09-04',
  })
  assert.deepEqual(firstPage.items.map(({ id }) => id), records.slice(0, 2).map(({ id }) => id))
  assert.match(firstPage.nextCursor ?? '', /^overdue\./)

  const secondPage = await services.tasks.list(student, {
    cursor: firstPage.nextCursor!,
    limit: 2,
    overdueBefore: '2026-09-04',
  })

  assert.deepEqual(secondPage.items.map(({ id }) => id), [records[2]!.id])
  assert.equal(secondPage.nextCursor, null)
  assert.deepEqual(received, [
    {
      limit: 2,
      scheduledBefore: new Date('2026-09-04T00:00:00.000Z'),
      status: 'PENDING',
    },
    {
      limit: 2,
      overdueCursor: {
        createdAt: records[1]!.createdAt,
        id: records[1]!.id,
        scheduledFor: records[1]!.scheduledFor,
      },
      scheduledBefore: new Date('2026-09-04T00:00:00.000Z'),
      status: 'PENDING',
    },
  ])
})
