import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import test from 'node:test'
import type { PrismaClient } from '../src/generated/prisma/client.js'
import { createPrismaStudentCoreStore } from '../src/student-core/prisma-store.js'
import type { ResolvedCurriculumTarget } from '../src/task-curriculum/types.js'

const timestamp = new Date('2026-09-30T12:00:00.000Z')
const target: ResolvedCurriculumTarget = {
  referenceKind: 'NODE',
  curriculumRefId: 'cn_parent',
  selectionMode: 'WHOLE',
  position: 0,
  labelSnapshot: 'raw parent',
  pathSnapshot: ['raw representation', 'raw parent'],
  representationIdSnapshot: 'cr_1',
  items: [{
    referenceKind: 'NODE',
    curriculumRefId: 'cn_child',
    labelSnapshot: 'raw child',
    pathSnapshot: ['raw representation', 'raw parent', 'raw child'],
    position: 0,
  }],
}

const taskInput = {
  studentProfileId: '00000000-0000-4000-8000-000000000001',
  createdByUserId: '00000000-0000-4000-8000-000000000002',
  source: 'PERSONAL' as const,
  studyPlanId: null,
  subjectId: null,
  topicId: null,
  title: 'Task',
  description: null,
  scheduledFor: timestamp,
  estimatedMinutes: 30,
  plannedTestCount: 0,
  status: 'PENDING' as const,
  completedAt: null,
  partialAt: null,
  skipReason: null,
  skippedAt: null,
}

test('task creation persists source-label/path snapshots and direct execution items atomically', async () => {
  const targetCreates: unknown[] = []
  const persistedTask = { id: '00000000-0000-4000-8000-000000000010', ...taskInput, createdAt: timestamp, updatedAt: timestamp }
  const transaction = {
    dailyTask: {
      create: async () => persistedTask,
      findUniqueOrThrow: async () => ({ ...persistedTask, curriculumTargets: [] }),
    },
    dailyTaskCurriculumTarget: {
      create: async (input: unknown) => {
        targetCreates.push(input)
        return {}
      },
    },
  }
  const prisma = {
    $transaction: async <T>(operation: (client: typeof transaction) => Promise<T>) => operation(transaction),
  } as unknown as PrismaClient

  await createPrismaStudentCoreStore(prisma).createTask(taskInput, [target])

  assert.deepEqual(targetCreates, [{ data: {
    curriculumRefId: 'cn_parent',
    dailyTaskId: persistedTask.id,
    labelSnapshot: 'raw parent',
    pathSnapshot: ['raw representation', 'raw parent'],
    position: 0,
    referenceKind: 'NODE',
    representationIdSnapshot: 'cr_1',
    selectionMode: 'WHOLE',
    items: { create: [{
      curriculumRefId: 'cn_child',
      dailyTaskId: persistedTask.id,
      labelSnapshot: 'raw child',
      pathSnapshot: ['raw representation', 'raw parent', 'raw child'],
      position: 0,
      referenceKind: 'NODE',
    }] },
  } }])
})

test('item toggle is task-owner scoped and cannot update a foreign item', async () => {
  const finds: unknown[] = []
  let itemUpdateCalled = false
  const transaction = {
    $queryRawUnsafe: async () => [],
    dailyTask: {
      findFirst: async (query: unknown) => {
        finds.push(query)
        return null
      },
    },
    dailyTaskCurriculumItem: {
      updateMany: async () => {
        itemUpdateCalled = true
        return { count: 1 }
      },
    },
  }
  const prisma = {
    $transaction: async <T>(operation: (client: typeof transaction) => Promise<T>) => operation(transaction),
  } as unknown as PrismaClient
  const result = await createPrismaStudentCoreStore(prisma).toggleTaskCurriculumItem!(
    taskInput.studentProfileId,
    '00000000-0000-4000-8000-000000000099',
    '00000000-0000-4000-8000-000000000098',
    timestamp,
  )

  assert.deepEqual(finds, [{
    select: { id: true, status: true },
    where: {
      id: '00000000-0000-4000-8000-000000000099',
      studentProfileId: taskInput.studentProfileId,
    },
  }])
  assert.deepEqual(result, { ok: false, reason: 'TASK_NOT_FOUND' })
  assert.equal(itemUpdateCalled, false)
})

test('planning migrations only touch approved DailyTask planning structures', async () => {
  const repoUrl = new URL('../../../', import.meta.url)
  const migrationsUrl = new URL('database/prisma/migrations/', repoUrl)
  const names = (await readdir(migrationsUrl, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
  assert.equal(names.length, 21)
  const migrationName = '20260930020000_add_planning_curriculum_references'
  assert.ok(names.includes(migrationName))
  const sql = await readFile(new URL(`${migrationName}/migration.sql`, migrationsUrl), 'utf8')
  assert.match(sql, /ALTER TYPE "DailyTaskStatus" ADD VALUE 'PARTIAL'/)
  assert.match(sql, /CREATE TABLE "daily_task_curriculum_targets"/)
  assert.match(sql, /CREATE TABLE "daily_task_curriculum_items"/)
  assert.match(sql, /daily_tasks_lifecycle_consistency_check/)
  assert.doesNotMatch(sql, /^(?:DROP|TRUNCATE|DELETE FROM|UPDATE |INSERT INTO)/gm)
  assert.doesNotMatch(sql, /ALTER TABLE "(?!daily_tasks|daily_task_curriculum_targets|daily_task_curriculum_items)/)

  const scheduleMigrationName = '20261001010000_add_daily_task_schedule_window'
  assert.ok(names.includes(scheduleMigrationName))
  const scheduleSql = await readFile(
    new URL(`${scheduleMigrationName}/migration.sql`, migrationsUrl),
    'utf8',
  )
  assert.match(scheduleSql, /ADD COLUMN "startMinuteOfDay" SMALLINT/)
  assert.match(scheduleSql, /ADD COLUMN "endMinuteOfDay" SMALLINT/)
  assert.match(scheduleSql, /daily_tasks_schedule_window_check/)
  assert.doesNotMatch(scheduleSql, /ALTER TABLE "(?!daily_tasks")/)
  assert.doesNotMatch(scheduleSql, /(?:DROP|TRUNCATE|DELETE FROM|UPDATE |INSERT INTO)/)
})
