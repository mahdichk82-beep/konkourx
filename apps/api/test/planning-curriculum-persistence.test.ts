import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import test from 'node:test'
import type { PrismaClient } from '../src/generated/prisma/client.js'
import { createPrismaStudentCoreStore } from '../src/student-core/prisma-store.js'
import type { ResolvedCurriculumTarget } from '../src/task-curriculum/types.js'
import { ApiError } from '../src/errors/api-error.js'

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

const subtreeTarget: ResolvedCurriculumTarget = {
  ...target,
  selectionMode: 'SUBTREE',
  items: [
    { ...target.items[0]!, curriculumRefId: 'cn_terminal_a', position: 0 },
    { ...target.items[0]!, curriculumRefId: 'cn_terminal_b', position: 1 },
  ],
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
    $queryRawUnsafe: async () => [],
    studentProfile: { findUnique: async () => ({ track: 'EXPERIMENTAL' }) },
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

  await createPrismaStudentCoreStore(prisma).createTask(taskInput, [target], 'EXPERIMENTAL')

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

test('task creation persists SUBTREE selector intent with immutable terminal item snapshots', async () => {
  const targetCreates: Array<{ data: Record<string, unknown> }> = []
  const persistedTask = { id: '00000000-0000-4000-8000-000000000011', ...taskInput, createdAt: timestamp, updatedAt: timestamp }
  const transaction = {
    $queryRawUnsafe: async () => [],
    studentProfile: { findUnique: async () => ({ track: 'EXPERIMENTAL' }) },
    dailyTask: {
      create: async () => persistedTask,
      findUniqueOrThrow: async () => ({ ...persistedTask, curriculumTargets: [] }),
    },
    dailyTaskCurriculumTarget: {
      create: async (input: { data: Record<string, unknown> }) => {
        targetCreates.push(input)
        return {}
      },
    },
  }
  const prisma = {
    $transaction: async <T>(operation: (client: typeof transaction) => Promise<T>) => operation(transaction),
  } as unknown as PrismaClient

  await createPrismaStudentCoreStore(prisma).createTask(taskInput, [subtreeTarget], 'EXPERIMENTAL')

  assert.equal(targetCreates[0]?.data.selectionMode, 'SUBTREE')
  assert.deepEqual(targetCreates[0]?.data.items, { create: [
    {
      curriculumRefId: 'cn_terminal_a',
      dailyTaskId: persistedTask.id,
      labelSnapshot: 'raw child',
      pathSnapshot: ['raw representation', 'raw parent', 'raw child'],
      position: 0,
      referenceKind: 'NODE',
    },
    {
      curriculumRefId: 'cn_terminal_b',
      dailyTaskId: persistedTask.id,
      labelSnapshot: 'raw child',
      pathSnapshot: ['raw representation', 'raw parent', 'raw child'],
      position: 1,
      referenceKind: 'NODE',
    },
  ] })
})

test('explicit replacement deletes the complete legacy set and writes only v2 targets in one transaction', async () => {
  const calls: string[] = []
  const persistedTask = { id: '00000000-0000-4000-8000-000000000012', ...taskInput, contentType: 'STUDY', createdAt: timestamp, updatedAt: timestamp }
  const transaction = {
    $queryRawUnsafe: async () => { calls.push('lock'); return [] },
    studentProfile: { findUnique: async () => ({ track: 'EXPERIMENTAL' }) },
    dailyTask: {
      findFirst: async () => ({ ...persistedTask, curriculumItems: [] }),
      findUniqueOrThrow: async () => ({ ...persistedTask, curriculumTargets: [] }),
    },
    dailyTaskCurriculumTarget: {
      deleteMany: async () => { calls.push('delete-legacy'); return { count: 1 } },
      create: async (input: { data: { selectionMode: string } }) => {
        calls.push(`create-${input.data.selectionMode}`)
        return {}
      },
    },
  }
  let transactionCalls = 0
  const prisma = {
    $transaction: async <T>(operation: (client: typeof transaction) => Promise<T>) => {
      transactionCalls++
      return operation(transaction)
    },
  } as unknown as PrismaClient

  const result = await createPrismaStudentCoreStore(prisma).replacePersonalTaskCurriculumTargets!(
    taskInput.studentProfileId,
    persistedTask.id,
    [subtreeTarget],
    'EXPERIMENTAL',
  )

  assert.equal(result.ok, true)
  assert.equal(transactionCalls, 1)
  assert.deepEqual(calls, ['lock', 'delete-legacy', 'create-SUBTREE'])
})

test('a failed replacement target write rolls the whole test transaction model back', async () => {
  const persistedTask = { id: '00000000-0000-4000-8000-000000000013', ...taskInput, contentType: 'STUDY', createdAt: timestamp, updatedAt: timestamp }
  const committed = [{ selectionMode: 'WHOLE', curriculumRefId: 'legacy-root' }]
  const transaction = {
    $queryRawUnsafe: async () => [],
    studentProfile: { findUnique: async () => ({ track: 'EXPERIMENTAL' }) },
    dailyTask: {
      findFirst: async () => ({ ...persistedTask, curriculumItems: [] }),
      findUniqueOrThrow: async () => ({ ...persistedTask, curriculumTargets: committed }),
    },
    dailyTaskCurriculumTarget: {
      deleteMany: async () => { committed.splice(0); return { count: 1 } },
      create: async () => {
        committed.push({ selectionMode: 'SUBTREE', curriculumRefId: subtreeTarget.curriculumRefId })
        throw new Error('simulated nested item write failure')
      },
    },
  }
  const prisma = {
    $transaction: async <T>(operation: (client: typeof transaction) => Promise<T>) => {
      const before = structuredClone(committed)
      try {
        return await operation(transaction)
      } catch (error) {
        committed.splice(0, committed.length, ...before)
        throw error
      }
    },
  } as unknown as PrismaClient

  await assert.rejects(
    createPrismaStudentCoreStore(prisma).replacePersonalTaskCurriculumTargets!(
      taskInput.studentProfileId,
      persistedTask.id,
      [subtreeTarget],
      'EXPERIMENTAL',
    ),
    /simulated nested item write failure/,
  )
  assert.deepEqual(committed, [{ selectionMode: 'WHOLE', curriculumRefId: 'legacy-root' }])
})

test('task create rejects a changed authoritative track inside its transaction before insertion', async () => {
  let inserted = false
  const transaction = {
    $queryRawUnsafe: async () => [],
    studentProfile: { findUnique: async () => ({ track: 'HUMANITIES' }) },
    dailyTask: { create: async () => { inserted = true; return { id: 'task-id' } } },
  }
  const prisma = {
    $transaction: async <T>(operation: (client: typeof transaction) => Promise<T>) => operation(transaction),
  } as unknown as PrismaClient
  await assert.rejects(
    createPrismaStudentCoreStore(prisma).createTask(taskInput, [target], 'EXPERIMENTAL'),
    (error: unknown) => error instanceof ApiError && error.code === 'CURRICULUM_TARGET_NOT_IN_STUDENT_TRACK',
  )
  assert.equal(inserted, false)
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
  const schema = await readFile(new URL('database/prisma/schema.prisma', repoUrl), 'utf8')
  const names = (await readdir(migrationsUrl, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
  assert.equal(names.length, 25)
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

  const subtreeMigrationName = '20261007195354_add_subtree_curriculum_selection'
  assert.ok(names.includes(subtreeMigrationName))
  const subtreeSql = (await readFile(
    new URL(`${subtreeMigrationName}/migration.sql`, migrationsUrl),
    'utf8',
  )).replace(/^--.*$/gm, '').trim()
  assert.equal(subtreeSql, `ALTER TYPE "CurriculumSelectionMode" ADD VALUE 'SUBTREE';`)
  assert.match(schema, /enum CurriculumSelectionMode \{\s+EXACT\s+WHOLE\s+SUBTREE\s+\}/)
})
