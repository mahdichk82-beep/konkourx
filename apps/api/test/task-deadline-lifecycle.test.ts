import assert from 'node:assert/strict'
import test from 'node:test'
import type { PrismaClient } from '../src/generated/prisma/client.js'
import { createPrismaCounselorTaskStore } from '../src/counselor-tasks/prisma-store.js'
import { createPrismaStudentCoreStore } from '../src/student-core/prisma-store.js'

const studentProfileId = '30000000-0000-4000-8000-000000000001'
const counselorUserId = '10000000-0000-4000-8000-000000000001'
const taskId = '60000000-0000-4000-8000-000000000001'
const eligibilityStartedAt = new Date('2026-10-09T08:00:00.000Z')
const oldScheduledFor = new Date('2026-10-09T00:00:00.000Z')
const effectiveAt = new Date('2026-10-10T20:31:00.000Z')

const pendingTask = {
  actualSolvedTestCount: 4,
  completedAt: null,
  createdAt: eligibilityStartedAt,
  createdByUserId: counselorUserId,
  deadlineEligibilityStartedAt: eligibilityStartedAt,
  deadlineMisses: [],
  description: null,
  endMinuteOfDay: null,
  estimatedMinutes: 30,
  id: taskId,
  partialAt: null,
  plannedTestCount: 10,
  scheduledFor: oldScheduledFor,
  skipReason: null,
  skippedAt: null,
  source: 'COUNSELOR' as const,
  startMinuteOfDay: null,
  status: 'PENDING' as const,
  studentProfileId,
  studyPlanId: null,
  subjectId: null,
  title: 'Task',
  topicId: null,
  updatedAt: eligibilityStartedAt,
}

test('late terminal transition records the old deadline and lifecycle timestamp atomically', async () => {
  const calls: string[] = []
  let findCount = 0
  let updateData: Record<string, unknown> | undefined
  const transaction = {
    async $queryRawUnsafe(sql: string) {
      if (sql.includes('FOR UPDATE')) {
        calls.push('lock')
        return [{ id: studentProfileId }]
      }
      calls.push('clock')
      return [{ effectiveAt }]
    },
    async $executeRawUnsafe(_sql: string, ...parameters: unknown[]) {
      calls.push('miss')
      assert.deepEqual(parameters, [taskId, '2026-10-09', eligibilityStartedAt, effectiveAt])
      return 1
    },
    dailyTask: {
      async findFirst() {
        findCount += 1
        calls.push('find')
        return findCount === 1 ? pendingTask : {
          ...pendingTask,
          completedAt: effectiveAt,
          status: 'COMPLETED',
        }
      },
      async updateMany(query: { data: Record<string, unknown> }) {
        calls.push('update')
        updateData = query.data
        return { count: 1 }
      },
    },
  }
  const prisma = {
    $transaction: async <T>(operation: (client: typeof transaction) => Promise<T>) => operation(transaction),
  } as unknown as PrismaClient

  const result = await createPrismaStudentCoreStore(prisma).updateTerminalTask(
    studentProfileId,
    taskId,
    { completedAt: new Date('2000-01-01T00:00:00.000Z'), status: 'COMPLETED' },
  )

  assert.equal(result.ok, true)
  assert.deepEqual(calls, ['lock', 'clock', 'find', 'miss', 'update', 'find'])
  assert.equal(updateData?.completedAt, effectiveAt)
})

test('returning a terminal task to pending resets eligibility under the student lock', async () => {
  let updateData: Record<string, unknown> | undefined
  const current = { ...pendingTask, completedAt: eligibilityStartedAt, status: 'COMPLETED' as const }
  const transaction = {
    async $queryRawUnsafe(sql: string) {
      return sql.includes('FOR UPDATE') ? [{ id: studentProfileId }] : [{ effectiveAt }]
    },
    dailyTask: {
      async findFirst() { return current },
      async updateMany(query: { data: Record<string, unknown> }) {
        updateData = query.data
        return { count: 1 }
      },
    },
  }
  const prisma = {
    $transaction: async <T>(operation: (client: typeof transaction) => Promise<T>) => operation(transaction),
  } as unknown as PrismaClient

  await createPrismaStudentCoreStore(prisma).updateTask(studentProfileId, taskId, {
    completedAt: null,
    status: 'PENDING',
  })

  assert.equal(updateData?.deadlineEligibilityStartedAt, effectiveAt)
})

test('late counselor rescheduling records the old day and resets eligibility for a changed day', async () => {
  let findCount = 0
  let updateData: Record<string, unknown> | undefined
  const nextScheduledFor = new Date('2026-10-12T00:00:00.000Z')
  const transaction = {
    async $queryRawUnsafe(sql: string) {
      return sql.includes('FOR UPDATE') ? [{ id: studentProfileId }] : [{ effectiveAt }]
    },
    async $executeRawUnsafe(_sql: string, ...parameters: unknown[]) {
      assert.deepEqual(parameters, [taskId, '2026-10-09', eligibilityStartedAt, effectiveAt])
      return 1
    },
    studentProfile: { findFirst: async () => ({ id: studentProfileId }) },
    dailyTask: {
      async findFirst() {
        findCount += 1
        return findCount === 1 ? pendingTask : { ...pendingTask, scheduledFor: nextScheduledFor }
      },
      async updateMany(query: { data: Record<string, unknown> }) {
        updateData = query.data
        return { count: 1 }
      },
    },
  }
  const prisma = {
    $transaction: async <T>(operation: (client: typeof transaction) => Promise<T>) => operation(transaction),
  } as unknown as PrismaClient

  const result = await createPrismaCounselorTaskStore(prisma).rescheduleAssignedStudentTask(
    counselorUserId,
    studentProfileId,
    taskId,
    { scheduledFor: nextScheduledFor },
  )

  assert.equal(result.ok, true)
  assert.equal(updateData?.deadlineEligibilityStartedAt, effectiveAt)
})
