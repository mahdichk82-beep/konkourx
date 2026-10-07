import assert from 'node:assert/strict'
import test from 'node:test'
import type { PrismaClient } from '../src/generated/prisma/client.js'
import { createCounselorTaskServices } from '../src/counselor-tasks/services.js'
import { createPrismaCounselorTaskStore } from '../src/counselor-tasks/prisma-store.js'
import { ApiError } from '../src/errors/api-error.js'
import type { ResolvedCurriculumTarget } from '../src/task-curriculum/types.js'

const ids = {
  counselor: '10000000-0000-4000-8000-000000000001',
  student: '30000000-0000-4000-8000-000000000001',
  subject: '40000000-0000-4000-8000-000000000001',
  topic: '50000000-0000-4000-8000-000000000001',
  task: '60000000-0000-4000-8000-000000000001',
} as const

const timestamp = new Date('2026-09-11T00:00:00.000Z')

test('Prisma counselor task visibility is assignment-scoped and does not select creator identity', async () => {
  const profileQueries: unknown[] = []
  const taskQueries: unknown[] = []
  const transaction = {
    studentProfile: {
      async findFirst(query: unknown) {
        profileQueries.push(query)
        return { id: ids.student }
      },
    },
    dailyTask: {
      async findMany(query: unknown) {
        taskQueries.push(query)
        return [{
          completedAt: null,
          partialAt: null,
          createdAt: timestamp,
          description: null,
          estimatedMinutes: 30,
          id: ids.task,
          plannedTestCount: 0,
          assessmentAttempts: [],
          curriculumTargets: [],
          scheduledFor: timestamp,
          skipReason: null,
          skippedAt: null,
          source: 'PERSONAL',
          status: 'PENDING',
          studySessions: [
            {
              cancelledAt: null,
              endedAt: new Date('2026-09-11T09:30:00.000Z'),
              startedAt: new Date('2026-09-11T09:00:00.000Z'),
            },
            {
              cancelledAt: null,
              endedAt: new Date('2026-09-11T10:45:00.000Z'),
              startedAt: new Date('2026-09-11T10:00:00.000Z'),
            },
            {
              cancelledAt: null,
              endedAt: null,
              startedAt: new Date('2026-09-11T11:00:00.000Z'),
            },
            {
              cancelledAt: new Date('2026-09-11T12:10:00.000Z'),
              endedAt: null,
              startedAt: new Date('2026-09-11T12:00:00.000Z'),
            },
          ],
          studentProfileId: ids.student,
          studyPlanId: null,
          subjectId: null,
          title: 'Visible task',
          topicId: null,
          updatedAt: timestamp,
        }]
      },
    },
  }
  const prisma = {
    async $transaction<T>(operation: (client: typeof transaction) => Promise<T>) {
      return operation(transaction)
    },
  } as unknown as PrismaClient
  const services = createCounselorTaskServices(createPrismaCounselorTaskStore(prisma))

  const result = await services.list(
    { id: ids.counselor, role: 'COUNSELOR', status: 'ACTIVE' },
    ids.student,
    { limit: 25 },
  )

  assert.deepEqual(profileQueries, [{
    select: { id: true },
    where: {
      id: ids.student,
      user: {
        studentRelationships: {
          some: { counselorId: ids.counselor, status: 'ACTIVE' },
        },
      },
    },
  }])
  assert.deepEqual(taskQueries, [{
    cursor: undefined,
    orderBy: [{ scheduledFor: 'desc' }, { createdAt: 'desc' }],
    select: {
      completedAt: true,
      contentType: true,
      partialAt: true,
      createdAt: true,
      description: true,
      endMinuteOfDay: true,
      estimatedMinutes: true,
      id: true,
      plannedTestCount: true,
      assessmentAttempts: {
        select: { id: true },
        take: 1,
        where: { invalidatedAt: null },
      },
      scheduledFor: true,
      skipReason: true,
      skippedAt: true,
      source: true,
      startMinuteOfDay: true,
      status: true,
      studySessions: {
        select: { cancelledAt: true, endedAt: true, startedAt: true },
      },
      studentProfileId: true,
      studyPlanId: true,
      subjectId: true,
      title: true,
      topicId: true,
      updatedAt: true,
      curriculumTargets: {
        orderBy: { position: 'asc' },
        include: { items: { orderBy: { position: 'asc' } } },
      },
    },
    skip: undefined,
    take: 26,
    where: { studentProfileId: ids.student },
  }])
  assert.equal(result.items[0]?.source, 'PERSONAL')
  assert.equal(result.items[0]?.recordedMinutes, 75)
  assert.equal(result.items[0]?.studySessionCount, 4)
  assert.equal(result.items[0]?.completedStudySessionCount, 2)
  assert.equal(result.items[0]?.hasActiveStudySession, true)
  assert.equal(result.items[0]?.hasValidAssessmentAttempt, false)
  assert.equal('createdByUserId' in (result.items[0] ?? {}), false)
})

test('Prisma counselor weekly visibility keeps assignment and student ownership predicates', async () => {
  const taskQueries: Array<{ where?: unknown }> = []
  const transaction = {
    studentProfile: {
      async findFirst() {
        return { id: ids.student }
      },
    },
    dailyTask: {
      async findMany(query: { where?: unknown }) {
        taskQueries.push(query)
        return []
      },
    },
  }
  const prisma = {
    async $transaction<T>(operation: (client: typeof transaction) => Promise<T>) {
      return operation(transaction)
    },
  } as unknown as PrismaClient
  const services = createCounselorTaskServices(createPrismaCounselorTaskStore(prisma))

  await services.list(
    { id: ids.counselor, role: 'COUNSELOR', status: 'ACTIVE' },
    ids.student,
    { scheduledFrom: '2026-09-12', scheduledTo: '2026-09-18' },
  )

  assert.deepEqual(taskQueries[0]?.where, {
    scheduledFor: {
      gte: new Date('2026-09-12T00:00:00.000Z'),
      lte: new Date('2026-09-18T00:00:00.000Z'),
    },
    studentProfileId: ids.student,
  })
})

test('Prisma counselor task creation validates assignment and relations atomically', async () => {
  const profileQueries: unknown[] = []
  const subjectQueries: unknown[] = []
  const topicQueries: unknown[] = []
  const taskCreates: Array<{ data: Record<string, unknown> }> = []
  let transactionCount = 0
  const transaction = {
    studentProfile: {
      async findFirst(query: unknown) {
        profileQueries.push(query)
        return { id: ids.student }
      },
    },
    studySubject: {
      async findFirst(query: unknown) {
        subjectQueries.push(query)
        return { id: ids.subject, archivedAt: null }
      },
    },
    topic: {
      async findFirst(query: unknown) {
        topicQueries.push(query)
        return { id: ids.topic, subjectId: ids.subject, archivedAt: null }
      },
    },
    dailyTask: {
      async create(input: { data: Record<string, unknown> }) {
        taskCreates.push(input)
        return { id: ids.task, ...input.data, createdAt: timestamp, updatedAt: timestamp }
      },
    },
  }
  const prisma = {
    async $transaction<T>(operation: (client: typeof transaction) => Promise<T>) {
      transactionCount += 1
      return operation(transaction)
    },
  } as unknown as PrismaClient
  const services = createCounselorTaskServices(createPrismaCounselorTaskStore(prisma))

  const result = await services.create(
    { id: ids.counselor, role: 'COUNSELOR', status: 'ACTIVE' },
    ids.student,
    {
      title: 'Review genetics',
      description: null,
      scheduledFor: '2026-09-12',
      startMinuteOfDay: 945,
      endMinuteOfDay: 1020,
      estimatedMinutes: 45,
      subjectId: ids.subject,
      topicId: ids.topic,
    },
  )

  assert.equal(transactionCount, 1)
  assert.deepEqual(profileQueries, [{
    select: { id: true },
    where: {
      id: ids.student,
      user: {
        studentRelationships: {
          some: { counselorId: ids.counselor, status: 'ACTIVE' },
        },
      },
    },
  }])
  assert.deepEqual(subjectQueries, [{
    where: { id: ids.subject, studentProfileId: ids.student },
  }])
  assert.deepEqual(topicQueries, [{
    where: { id: ids.topic, subject: { studentProfileId: ids.student } },
  }])
  assert.deepEqual(taskCreates[0]?.data, {
    completedAt: null,
    contentType: null,
    partialAt: null,
    createdByUserId: ids.counselor,
    description: null,
    endMinuteOfDay: 1020,
    estimatedMinutes: 45,
    plannedTestCount: 0,
    scheduledFor: new Date('2026-09-12T00:00:00.000Z'),
    startMinuteOfDay: 945,
    skipReason: null,
    skippedAt: null,
    source: 'COUNSELOR',
    status: 'PENDING',
    studentProfileId: ids.student,
    studyPlanId: null,
    subjectId: ids.subject,
    title: 'Review genetics',
    topicId: ids.topic,
  })
  assert.equal(result.source, 'COUNSELOR')
  assert.equal(result.studentProfileId, ids.student)
  assert.equal(result.miniBoxSpan, 5)
  assert.equal('createdByUserId' in result, false)
})

test('Prisma counselor batch creation verifies profile, assignment, resources, and inserts once', async () => {
  const counselorQueries: unknown[] = []
  const profileQueries: unknown[] = []
  const subjectQueries: unknown[] = []
  const topicQueries: unknown[] = []
  const batchCreates: Array<{ data: Array<Record<string, unknown>> }> = []
  let transactionCount = 0
  const transaction = {
    counselorProfile: {
      async findUnique(query: unknown) {
        counselorQueries.push(query)
        return { id: ids.counselor }
      },
    },
    studentProfile: {
      async findFirst(query: unknown) {
        profileQueries.push(query)
        return { id: ids.student }
      },
    },
    studySubject: {
      async findFirst(query: unknown) {
        subjectQueries.push(query)
        return { id: ids.subject, archivedAt: null }
      },
    },
    topic: {
      async findFirst(query: unknown) {
        topicQueries.push(query)
        return { id: ids.topic, subjectId: ids.subject, archivedAt: null }
      },
    },
    dailyTask: {
      async createManyAndReturn(input: { data: Array<Record<string, unknown>> }) {
        batchCreates.push(input)
        return input.data.map((data, index) => ({
          id: `60000000-0000-4000-8000-${String(index + 10).padStart(12, '0')}`,
          ...data,
          createdAt: timestamp,
          updatedAt: timestamp,
        }))
      },
    },
  }
  const prisma = {
    async $transaction<T>(operation: (client: typeof transaction) => Promise<T>) {
      transactionCount += 1
      return operation(transaction)
    },
  } as unknown as PrismaClient
  const services = createCounselorTaskServices(createPrismaCounselorTaskStore(prisma))

  const result = await services.createBatch(
    { id: ids.counselor, role: 'COUNSELOR', status: 'ACTIVE' },
    ids.student,
    {
      tasks: [
        {
          title: 'Biology batch task',
          description: null,
          scheduledFor: '2026-09-15',
          plannedMinutes: 90,
          plannedTestCount: 12,
          subjectId: ids.subject,
          topicId: ids.topic,
        },
        {
          title: 'Unlinked batch task',
          description: null,
          scheduledFor: '2026-09-16',
          plannedMinutes: 0,
          plannedTestCount: 0,
          subjectId: null,
          topicId: null,
        },
      ],
    },
  )

  assert.equal(transactionCount, 1)
  assert.deepEqual(counselorQueries, [{
    select: { id: true },
    where: { userId: ids.counselor },
  }])
  assert.deepEqual(profileQueries, [{
    select: { id: true },
    where: {
      id: ids.student,
      user: {
        studentRelationships: {
          some: { counselorId: ids.counselor, status: 'ACTIVE' },
        },
      },
    },
  }])
  assert.deepEqual(subjectQueries, [{
    where: { id: ids.subject, studentProfileId: ids.student },
  }])
  assert.deepEqual(topicQueries, [{
    where: { id: ids.topic, subject: { studentProfileId: ids.student } },
  }])
  assert.equal(batchCreates.length, 1)
  assert.equal(batchCreates[0]?.data.length, 2)
  assert.deepEqual(batchCreates[0]?.data[0], {
    completedAt: null,
    contentType: null,
    partialAt: null,
    createdByUserId: ids.counselor,
    description: null,
    endMinuteOfDay: null,
    estimatedMinutes: 90,
    plannedTestCount: 12,
    scheduledFor: new Date('2026-09-15T00:00:00.000Z'),
    startMinuteOfDay: null,
    skipReason: null,
    skippedAt: null,
    source: 'COUNSELOR',
    status: 'PENDING',
    studentProfileId: ids.student,
    studyPlanId: null,
    subjectId: ids.subject,
    title: 'Biology batch task',
    topicId: ids.topic,
  })
  assert.equal(result.created, 2)
  assert.equal(result.tasks.every((task) => task.source === 'COUNSELOR'), true)
  assert.equal(result.tasks.every((task) => !('createdByUserId' in task)), true)
})

test('Prisma counselor batch creation rolls back when the atomic insert fails', async () => {
  const persisted: Array<Record<string, unknown>> = []
  let transactionCount = 0
  const transaction = {
    counselorProfile: { findUnique: async () => ({ id: ids.counselor }) },
    studentProfile: { findFirst: async () => ({ id: ids.student }) },
    dailyTask: {
      async createManyAndReturn(input: { data: Array<Record<string, unknown>> }) {
        persisted.push(input.data[0] ?? {})
        throw new Error('simulated batch insert failure')
      },
    },
  }
  const prisma = {
    async $transaction<T>(operation: (client: typeof transaction) => Promise<T>) {
      transactionCount += 1
      const snapshotLength = persisted.length
      try {
        return await operation(transaction)
      } catch (error) {
        persisted.splice(snapshotLength)
        throw error
      }
    },
  } as unknown as PrismaClient
  const services = createCounselorTaskServices(createPrismaCounselorTaskStore(prisma))

  await assert.rejects(
    services.createBatch(
      { id: ids.counselor, role: 'COUNSELOR', status: 'ACTIVE' },
      ids.student,
      {
        tasks: [
          {
            title: 'First task',
            description: null,
            scheduledFor: '2026-09-15',
            plannedMinutes: 30,
            plannedTestCount: 0,
            subjectId: null,
            topicId: null,
          },
          {
            title: 'Second task',
            description: null,
            scheduledFor: '2026-09-16',
            plannedMinutes: 30,
            plannedTestCount: 0,
            subjectId: null,
            topicId: null,
          },
        ],
      },
    ),
    /simulated batch insert failure/,
  )
  assert.equal(transactionCount, 1)
  assert.deepEqual(persisted, [])
})

test('Prisma counselor batch creation requires a persisted counselor profile', async () => {
  let assignmentChecked = false
  let insertCalled = false
  const transaction = {
    counselorProfile: { findUnique: async () => null },
    studentProfile: {
      async findFirst() {
        assignmentChecked = true
        return { id: ids.student }
      },
    },
    dailyTask: {
      async createManyAndReturn() {
        insertCalled = true
        return []
      },
    },
  }
  const prisma = {
    async $transaction<T>(operation: (client: typeof transaction) => Promise<T>) {
      return operation(transaction)
    },
  } as unknown as PrismaClient
  const services = createCounselorTaskServices(createPrismaCounselorTaskStore(prisma))

  await assert.rejects(
    services.createBatch(
      { id: ids.counselor, role: 'COUNSELOR', status: 'ACTIVE' },
      ids.student,
      {
        tasks: [{
          title: 'Blocked task',
          description: null,
          scheduledFor: '2026-09-15',
          plannedMinutes: 30,
          plannedTestCount: 0,
          subjectId: null,
          topicId: null,
        }],
      },
    ),
    (error: unknown) => error instanceof ApiError && error.code === 'COUNSELOR_PROFILE_REQUIRED',
  )
  assert.equal(assignmentChecked, false)
  assert.equal(insertCalled, false)
})

test('Prisma counselor rescheduling ignores cancelled-only history but excludes active or finished sessions', async () => {
  const profileQueries: unknown[] = []
  const taskFindQueries: unknown[] = []
  const taskUpdateQueries: unknown[] = []
  const task = {
    completedAt: null,
    createdAt: timestamp,
    createdByUserId: ids.counselor,
    description: null,
    estimatedMinutes: 30,
    id: ids.task,
    scheduledFor: timestamp,
    source: 'COUNSELOR' as const,
    status: 'PENDING' as const,
    studentProfileId: ids.student,
    studyPlanId: null,
    subjectId: null,
    title: 'Counselor task',
    topicId: null,
    updatedAt: timestamp,
  }
  const transaction = {
    async $queryRawUnsafe() { return [{ id: ids.student }] },
    studentProfile: {
      async findFirst(query: unknown) {
        profileQueries.push(query)
        return { id: ids.student }
      },
    },
    dailyTask: {
      async findFirst(query: unknown) {
        taskFindQueries.push(query)
        return task
      },
      async updateMany(query: unknown) {
        taskUpdateQueries.push(query)
        return { count: 1 }
      },
    },
  }
  const prisma = {
    async $transaction<T>(operation: (client: typeof transaction) => Promise<T>) {
      return operation(transaction)
    },
  } as unknown as PrismaClient
  const store = createPrismaCounselorTaskStore(prisma)
  const scheduledFor = new Date('2026-09-15T00:00:00.000Z')

  const result = await store.rescheduleAssignedStudentTask(
    ids.counselor,
    ids.student,
    ids.task,
    { scheduledFor, startMinuteOfDay: 945, endMinuteOfDay: 1020 },
  )

  assert.equal(result.ok, true)
  assert.deepEqual(profileQueries, [{
    select: { id: true },
    where: {
      id: ids.student,
      user: {
        studentRelationships: {
          some: { counselorId: ids.counselor, status: 'ACTIVE' },
        },
      },
    },
  }])
  assert.deepEqual(taskFindQueries, [
    { where: { id: ids.task, studentProfileId: ids.student } },
    {
      include: {
        curriculumTargets: {
          orderBy: { position: 'asc' },
          include: { items: { orderBy: { position: 'asc' } } },
        },
      },
      where: { id: ids.task, studentProfileId: ids.student },
    },
  ])
  assert.deepEqual(taskUpdateQueries, [{
    data: { scheduledFor, startMinuteOfDay: 945, endMinuteOfDay: 1020 },
    where: {
      id: ids.task,
      source: 'COUNSELOR',
      studentProfileId: ids.student,
      assessmentAttempts: { none: { invalidatedAt: null } },
      curriculumItems: { none: { completedAt: { not: null } } },
      studySessions: { none: { cancelledAt: null } },
    },
  }])
})

test('Prisma counselor task creation stops before insert when assignment is absent', async () => {
  let createCalled = false
  const transaction = {
    studentProfile: { findFirst: async () => null },
    dailyTask: {
      async create() {
        createCalled = true
        throw new Error('must not create')
      },
    },
  }
  const prisma = {
    async $transaction<T>(operation: (client: typeof transaction) => Promise<T>) {
      return operation(transaction)
    },
  } as unknown as PrismaClient
  const store = createPrismaCounselorTaskStore(prisma)
  const result = await store.createAssignedStudentTask(ids.counselor, ids.student, {
    completedAt: null,
    createdByUserId: ids.counselor,
    description: null,
    estimatedMinutes: null,
    plannedTestCount: 0,
    scheduledFor: timestamp,
    source: 'COUNSELOR',
    status: 'PENDING',
    studentProfileId: ids.student,
    studyPlanId: null,
    subjectId: null,
    title: 'Blocked task',
    topicId: null,
  })

  assert.deepEqual(result, { ok: false, reason: 'STUDENT_NOT_FOUND' })
  assert.equal(createCalled, false)
})

test('Prisma counselor resource queries require active assignment and active resources', async () => {
  const profileQueries: unknown[] = []
  const subjectLists: unknown[] = []
  const subjectFinds: unknown[] = []
  const topicLists: unknown[] = []
  const transaction = {
    studentProfile: {
      async findFirst(query: unknown) {
        profileQueries.push(query)
        return { id: ids.student }
      },
    },
    studySubject: {
      async findMany(query: unknown) {
        subjectLists.push(query)
        return [{ id: ids.subject, name: 'Biology' }]
      },
      async findFirst(query: unknown) {
        subjectFinds.push(query)
        return { id: ids.subject }
      },
    },
    topic: {
      async findMany(query: unknown) {
        topicLists.push(query)
        return [{ id: ids.topic, subjectId: ids.subject, title: 'Genetics' }]
      },
    },
  }
  const prisma = {
    async $transaction<T>(operation: (client: typeof transaction) => Promise<T>) {
      return operation(transaction)
    },
  } as unknown as PrismaClient
  const store = createPrismaCounselorTaskStore(prisma)

  await store.listAssignedStudentSubjects(ids.counselor, ids.student, { limit: 25 })
  await store.listAssignedStudentTopics(ids.counselor, ids.student, ids.subject, { limit: 25 })

  assert.equal(profileQueries.length, 2)
  assert.deepEqual(subjectLists, [{
    cursor: undefined,
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
    select: { id: true, name: true },
    skip: undefined,
    take: 26,
    where: { archivedAt: null, studentProfileId: ids.student },
  }])
  assert.deepEqual(subjectFinds, [{
    select: { id: true },
    where: { archivedAt: null, id: ids.subject, studentProfileId: ids.student },
  }])
  assert.deepEqual(topicLists, [{
    cursor: undefined,
    orderBy: [{ title: 'asc' }, { id: 'asc' }],
    select: { id: true, subjectId: true, title: true },
    skip: undefined,
    take: 26,
    where: { archivedAt: null, subjectId: ids.subject },
  }])
})

test('counselor target replacement checks explicit GENERAL before deleting historical targets', async () => {
  let deleted = false
  const transaction = {
    $queryRawUnsafe: async () => [],
    studentProfile: {
      findFirst: async () => ({ id: ids.student }),
      findUnique: async () => ({ track: 'EXPERIMENTAL' }),
    },
    dailyTask: {
      findFirst: async () => ({
        id: ids.task, source: 'COUNSELOR', status: 'PENDING', contentType: 'GENERAL',
        curriculumItems: [],
      }),
    },
    dailyTaskCurriculumTarget: { deleteMany: async () => { deleted = true } },
  }
  const prisma = {
    $transaction: async <T>(operation: (client: typeof transaction) => Promise<T>) => operation(transaction),
  } as unknown as PrismaClient
  const proposed = [{
    referenceKind: 'NODE', curriculumRefId: 'node', selectionMode: 'EXACT', position: 0,
    labelSnapshot: 'node', pathSnapshot: ['node'], representationIdSnapshot: 'representation', items: [],
  }] as ResolvedCurriculumTarget[]
  const result = await createPrismaCounselorTaskStore(prisma).replaceAssignedTaskCurriculumTargets!(
    ids.counselor, ids.student, ids.task, proposed, 'EXPERIMENTAL',
  )
  assert.deepEqual(result, { ok: false, reason: 'TASK_GENERAL_TARGET_FORBIDDEN' })
  assert.equal(deleted, false)
})
