import assert from 'node:assert/strict'
import test from 'node:test'
import type { PrismaClient } from '../src/generated/prisma/client.js'
import { createPrismaStudentCoreStore } from '../src/student-core/prisma-store.js'

const curriculumInclude = {
  curriculumTargets: {
    orderBy: { position: 'asc' },
    include: { items: { orderBy: { position: 'asc' } } },
  },
  deadlineMisses: {
    orderBy: { scheduledFor: 'asc' },
  },
}

test('Prisma plan and task queries skip cursor rows and fetch one lookahead row', async () => {
  const planQueries: unknown[] = []
  const taskQueries: unknown[] = []
  const prisma = {
    studyPlan: {
      async findMany(query: unknown) {
        planQueries.push(query)
        return []
      },
    },
    dailyTask: {
      async findMany(query: unknown) {
        taskQueries.push(query)
        return []
      },
    },
  } as unknown as PrismaClient
  const store = createPrismaStudentCoreStore(prisma)
  const scheduledFor = new Date('2026-09-03T00:00:00.000Z')
  const scheduledFrom = new Date('2026-09-12T00:00:00.000Z')
  const scheduledTo = new Date('2026-09-18T00:00:00.000Z')
  const scheduledBefore = new Date('2026-09-03T00:00:00.000Z')
  const overdueCursor = {
    createdAt: new Date('2026-09-02T09:30:00.000Z'),
    id: '00000000-0000-4000-8000-000000000123',
    scheduledFor: new Date('2026-09-02T00:00:00.000Z'),
  }

  await store.listPlans('student-profile-1', { cursor: 'plan-2', limit: 2, status: 'ACTIVE' })
  await store.listTasks('student-profile-1', {
    cursor: 'task-2',
    limit: 2,
    scheduledFor,
    status: 'PENDING',
    studyPlanId: 'plan-1',
    subjectId: 'subject-1',
  })
  await store.listTasks('student-profile-1', { scheduledFrom, scheduledTo })
  await store.listTasks('student-profile-1', {
    limit: 20,
    overdueCursor,
    scheduledBefore,
  })

  assert.deepEqual(planQueries[0], {
    cursor: { id: 'plan-2' },
    orderBy: { startsOn: 'desc' },
    skip: 1,
    take: 3,
    where: { studentProfileId: 'student-profile-1', status: 'ACTIVE' },
  })
  assert.deepEqual(taskQueries[0], {
    include: curriculumInclude,
    cursor: { id: 'task-2' },
    orderBy: [{ scheduledFor: 'desc' }, { createdAt: 'desc' }],
    skip: 1,
    take: 3,
    where: {
      scheduledFor,
      status: 'PENDING',
      studentProfileId: 'student-profile-1',
      studyPlanId: 'plan-1',
      subjectId: 'subject-1',
    },
  })
  assert.deepEqual(taskQueries[1], {
    include: curriculumInclude,
    cursor: undefined,
    orderBy: [{ scheduledFor: 'desc' }, { createdAt: 'desc' }],
    skip: undefined,
    take: undefined,
    where: {
      scheduledFor: { gte: scheduledFrom, lte: scheduledTo },
      status: undefined,
      studentProfileId: 'student-profile-1',
      studyPlanId: undefined,
      subjectId: undefined,
    },
  })
  assert.deepEqual(taskQueries[2], {
    include: curriculumInclude,
    cursor: undefined,
    orderBy: [{ scheduledFor: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
    skip: undefined,
    take: 21,
    where: {
      AND: [
        {
          scheduledFor: { lt: scheduledBefore },
          status: 'PENDING',
          studentProfileId: 'student-profile-1',
          studyPlanId: undefined,
          subjectId: undefined,
        },
        {
          OR: [
            { scheduledFor: { lt: overdueCursor.scheduledFor } },
            { createdAt: { lt: overdueCursor.createdAt }, scheduledFor: overdueCursor.scheduledFor },
            { createdAt: overdueCursor.createdAt, id: { lt: overdueCursor.id }, scheduledFor: overdueCursor.scheduledFor },
          ],
        },
      ],
    },
  })
})

test('Prisma task reads and updates always include student ownership', async () => {
  const findQueries: unknown[] = []
  const updateQueries: unknown[] = []
  const prisma = {
    dailyTask: {
      async findFirst(query: unknown) {
        findQueries.push(query)
        return null
      },
      async updateMany(query: unknown) {
        updateQueries.push(query)
        return { count: 0 }
      },
    },
  } as unknown as PrismaClient
  const store = createPrismaStudentCoreStore(prisma)

  const found = await store.findTaskById('student-profile-1', 'task-1')
  const updated = await store.updateTask('student-profile-1', 'task-1', {
    status: 'COMPLETED',
  })

  assert.equal(found, null)
  assert.equal(updated, null)
  assert.deepEqual(findQueries, [
    { include: curriculumInclude, where: { id: 'task-1', studentProfileId: 'student-profile-1' } },
  ])
  assert.deepEqual(updateQueries, [
    {
      data: { status: 'COMPLETED' },
      where: { id: 'task-1', studentProfileId: 'student-profile-1' },
    },
  ])
})

test('Prisma student rescheduling ignores cancelled-only history but excludes active or finished sessions', async () => {
  const findQueries: unknown[] = []
  const updateQueries: unknown[] = []
  const task = {
    completedAt: null,
    createdAt: new Date('2026-09-03T00:00:00.000Z'),
    createdByUserId: 'student-user-1',
    description: null,
    deadlineEligibilityStartedAt: new Date('2026-09-03T00:00:00.000Z'),
    estimatedMinutes: 30,
    id: 'task-1',
    scheduledFor: new Date('2026-09-03T00:00:00.000Z'),
    source: 'PERSONAL' as const,
    status: 'PENDING' as const,
    studentProfileId: 'student-profile-1',
    studyPlanId: null,
    subjectId: null,
    title: 'Task',
    topicId: null,
    updatedAt: new Date('2026-09-03T00:00:00.000Z'),
  }
  const transaction = {
    async $queryRawUnsafe(sql: string) {
      return sql.includes('FOR UPDATE')
        ? [{ id: 'student-profile-1' }]
        : [{ effectiveAt: new Date('2026-09-03T10:00:00.000Z') }]
    },
    async $executeRawUnsafe() { return 0 },
    dailyTask: {
      async findFirst(query: unknown) {
        findQueries.push(query)
        return task
      },
      async updateMany(query: unknown) {
        updateQueries.push(query)
        return { count: 1 }
      },
    },
  }
  const prisma = {
    async $transaction<T>(operation: (client: typeof transaction) => Promise<T>) {
      return operation(transaction)
    },
  } as unknown as PrismaClient
  const store = createPrismaStudentCoreStore(prisma)
  const scheduledFor = new Date('2026-09-04T00:00:00.000Z')

  const result = await store.reschedulePersonalTask(
    'student-profile-1',
    'task-1',
    { scheduledFor, startMinuteOfDay: 480, endMinuteOfDay: 540 },
  )

  assert.equal(result.ok, true)
  assert.deepEqual(findQueries, [
    { where: { id: 'task-1', studentProfileId: 'student-profile-1' } },
    { include: curriculumInclude, where: { id: 'task-1', studentProfileId: 'student-profile-1' } },
  ])
  assert.deepEqual(updateQueries, [{
    data: {
      scheduledFor,
      startMinuteOfDay: 480,
      endMinuteOfDay: 540,
      deadlineEligibilityStartedAt: new Date('2026-09-03T10:00:00.000Z'),
    },
    where: {
      id: 'task-1',
      source: 'PERSONAL',
      studentProfileId: 'student-profile-1',
      curriculumItems: { none: { completedAt: { not: null } } },
      assessmentAttempts: { none: { invalidatedAt: null } },
      studySessions: { none: { cancelledAt: null } },
    },
  }])
})

test('Prisma terminal task mutation locks the student and excludes active but not cancelled sessions', async () => {
  const calls: string[] = []
  const task = {
    completedAt: new Date('2026-09-03T09:00:00.000Z'),
    createdAt: new Date('2026-09-03T00:00:00.000Z'),
    createdByUserId: 'student-user-1',
    description: null,
    deadlineEligibilityStartedAt: new Date('2026-09-03T00:00:00.000Z'),
    estimatedMinutes: 30,
    id: 'task-1',
    plannedTestCount: 0,
    scheduledFor: new Date('2026-09-03T00:00:00.000Z'),
    skipReason: null,
    skippedAt: null,
    source: 'PERSONAL' as const,
    status: 'COMPLETED' as const,
    studentProfileId: 'student-profile-1',
    studyPlanId: null,
    subjectId: null,
    title: 'Task',
    topicId: null,
    updatedAt: new Date('2026-09-03T09:00:00.000Z'),
  }
  let findCount = 0
  const transaction = {
    async $queryRawUnsafe(sql: string, profileId?: string) {
      if (sql.includes('FOR UPDATE')) {
        calls.push('lock')
        assert.equal(sql, 'SELECT "id" FROM "student_profiles" WHERE "id" = $1::uuid FOR UPDATE')
        assert.equal(profileId, 'student-profile-1')
        return [{ id: profileId }]
      }
      calls.push('clock')
      return [{ effectiveAt: task.completedAt }]
    },
    async $executeRawUnsafe() {
      calls.push('miss')
      return 0
    },
    dailyTask: {
      async findFirst() {
        findCount += 1
        calls.push('find')
        return findCount === 1
          ? {
              deadlineEligibilityStartedAt: task.deadlineEligibilityStartedAt,
              id: task.id,
              scheduledFor: task.scheduledFor,
              status: 'PENDING',
            }
          : task
      },
      async updateMany(query: { where: unknown }) {
        calls.push('update')
        assert.deepEqual(query.where, {
          id: 'task-1',
          studentProfileId: 'student-profile-1',
          studySessions: { none: { cancelledAt: null, endedAt: null } },
        })
        return { count: 1 }
      },
    },
  }
  const prisma = {
    async $transaction<T>(operation: (client: typeof transaction) => Promise<T>) {
      return operation(transaction)
    },
  } as unknown as PrismaClient

  const result = await createPrismaStudentCoreStore(prisma).updateTerminalTask(
    'student-profile-1',
    'task-1',
    { completedAt: task.completedAt, status: 'COMPLETED' },
  )

  assert.deepEqual(calls, ['lock', 'clock', 'find', 'miss', 'update', 'find'])
  assert.deepEqual(result, { ok: true, value: task })
})

test('Prisma topic lists, reads, and updates always include subject ownership', async () => {
  const listQueries: unknown[] = []
  const findQueries: unknown[] = []
  const updateQueries: unknown[] = []
  const prisma = {
    topic: {
      async findMany(query: unknown) {
        listQueries.push(query)
        return []
      },
      async findFirst(query: unknown) {
        findQueries.push(query)
        return null
      },
      async updateMany(query: unknown) {
        updateQueries.push(query)
        return { count: 0 }
      },
    },
  } as unknown as PrismaClient
  const store = createPrismaStudentCoreStore(prisma)

  await store.listTopics('student-profile-1', 'subject-1', { cursor: 'topic-2', limit: 2 })
  await store.findTopicById('student-profile-1', 'topic-1')
  await store.updateTopic('student-profile-1', 'topic-1', { title: 'Updated' })

  assert.deepEqual(listQueries, [{
    cursor: { id: 'topic-2' },
    orderBy: { createdAt: 'desc' },
    skip: 1,
    take: 3,
    where: { subjectId: 'subject-1', subject: { studentProfileId: 'student-profile-1' } },
  }])
  assert.deepEqual(findQueries, [
    { where: { id: 'topic-1', subject: { studentProfileId: 'student-profile-1' } } },
  ])
  assert.deepEqual(updateQueries, [{
    data: { title: 'Updated' },
    where: { id: 'topic-1', subject: { studentProfileId: 'student-profile-1' } },
  }])
})

test('Prisma progress mutation atomically replaces the cumulative total for the matching pending study version', async () => {
  const expectedUpdatedAt = new Date('2026-09-03T08:00:00.000Z')
  const updatedTask = {
    actualSolvedTestCount: 12,
    contentType: 'STUDY' as const,
    id: 'task-1',
    status: 'PENDING' as const,
    studentProfileId: 'student-profile-1',
    updatedAt: new Date('2026-09-03T08:01:00.000Z'),
  }
  const calls: unknown[] = []
  let findCount = 0
  const transaction = {
    async $queryRawUnsafe(sql: string, profileId: string) {
      calls.push({ lock: { profileId, sql } })
      return [{ id: profileId }]
    },
    dailyTask: {
      async findFirst(query: unknown) {
        findCount += 1
        calls.push({ find: query })
        return findCount === 1
          ? { contentType: 'STUDY', id: 'task-1', status: 'PENDING' }
          : updatedTask
      },
      async updateMany(query: unknown) {
        calls.push({ update: query })
        return { count: 1 }
      },
    },
  }
  const prisma = {
    async $transaction<T>(operation: (client: typeof transaction) => Promise<T>) {
      return operation(transaction)
    },
  } as unknown as PrismaClient

  const result = await createPrismaStudentCoreStore(prisma).updateTaskProgress(
    'student-profile-1',
    'task-1',
    { actualSolvedTestCount: 12, expectedUpdatedAt },
  )

  assert.deepEqual(result, { ok: true, value: updatedTask })
  assert.deepEqual(calls[2], {
    update: {
      data: { actualSolvedTestCount: 12 },
      where: {
        contentType: 'STUDY',
        id: 'task-1',
        status: 'PENDING',
        studentProfileId: 'student-profile-1',
        updatedAt: expectedUpdatedAt,
      },
    },
  })
})
