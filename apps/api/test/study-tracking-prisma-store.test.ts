import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import type { PrismaClient } from '../src/generated/prisma/client.js'
import { createPrismaStudyTrackingStore } from '../src/study-tracking/prisma-store.js'

test('Prisma task-session reads retain student and task ownership filters', async () => {
  const queries: unknown[] = []
  const prisma = {
    studySession: {
      async findMany(query: unknown) {
        queries.push(query)
        return []
      },
    },
  } as unknown as PrismaClient
  const store = createPrismaStudyTrackingStore(prisma)

  await store.listSessions('student-profile-1', {
    dailyTaskId: 'task-1',
    limit: 20,
  })

  assert.deepEqual(queries, [{
    cursor: undefined,
    orderBy: { startedAt: 'desc' },
    skip: undefined,
    take: 21,
    include: { pauses: { orderBy: [{ pausedAt: 'asc' }, { id: 'asc' }] } },
    where: {
      dailyTaskId: 'task-1',
      startedAt: undefined,
      studentProfileId: 'student-profile-1',
      subjectId: undefined,
    },
  }])
})

test('Prisma generic session updates remain limited to finished non-cancelled history', async () => {
  const updates: unknown[] = []
  const prisma = {
    studySession: {
      async findFirst() { return null },
      async updateMany(query: unknown) {
        updates.push(query)
        return { count: 0 }
      },
    },
  } as unknown as PrismaClient

  const result = await createPrismaStudyTrackingStore(prisma)
    .updateSession('student-profile-1', 'session-1', { notes: 'edited' })

  assert.equal(result, null)
  assert.deepEqual(updates, [{
    data: { notes: 'edited' },
    where: {
      cancelledAt: null,
      endedAt: { not: null },
      id: 'session-1',
      isTimerManaged: false,
      studentProfileId: 'student-profile-1',
    },
  }])
})

test('Prisma session finish atomically retains ownership and unfinished predicates', async () => {
  const finds: unknown[] = []
  const locks: unknown[][] = []
  const updates: unknown[] = []
  const startedAt = new Date('2026-09-03T08:00:00.000Z')
  const endedAt = new Date('2026-09-03T09:00:00.000Z')
  const session = {
    cancelledAt: null,
    id: 'session-1',
    studentProfileId: 'student-profile-1',
    subjectId: null,
    dailyTaskId: 'task-1',
    startedAt,
    endedAt: null,
    notes: null,
    createdAt: startedAt,
    updatedAt: startedAt,
  }
  const transaction = {
    async $queryRawUnsafe(...args: unknown[]) {
      locks.push(args)
      return [{ id: 'student-profile-1' }]
    },
    studySession: {
      async findFirst(query: unknown) {
        finds.push(query)
        return finds.length === 1 ? session : { ...session, endedAt }
      },
      async updateMany(query: unknown) {
        updates.push(query)
        return { count: 1 }
      },
    },
  }
  const prisma = {
    async $transaction<T>(operation: (client: typeof transaction) => Promise<T>) {
      return operation(transaction)
    },
  } as unknown as PrismaClient
  const store = createPrismaStudyTrackingStore(prisma)

  const result = await store.finishSession('student-profile-1', 'session-1', endedAt, { notes: 'Done' })

  assert.equal(result.ok, true)
  assert.deepEqual(locks, [[
    'SELECT "id" FROM "student_profiles" WHERE "id" = $1::uuid FOR UPDATE',
    'student-profile-1',
  ]])
  assert.deepEqual(finds, [
    {
      include: { pauses: { orderBy: [{ pausedAt: 'asc' }, { id: 'asc' }] } },
      where: { id: 'session-1', studentProfileId: 'student-profile-1' },
    },
    {
      include: { pauses: { orderBy: [{ pausedAt: 'asc' }, { id: 'asc' }] } },
      where: { id: 'session-1', studentProfileId: 'student-profile-1' },
    },
  ])
  assert.deepEqual(updates, [{
    data: { endedAt, notes: 'Done' },
    where: {
      cancelledAt: null,
      endedAt: null,
      id: 'session-1',
      startedAt: { lt: endedAt },
      studentProfileId: 'student-profile-1',
    },
  }])
})

test('Prisma live start locks the student row before inspecting active sessions', async () => {
  const calls: string[] = []
  const startedAt = new Date('2026-09-03T08:00:00.000Z')
  const created = {
    cancelledAt: null,
    id: 'session-1',
    studentProfileId: 'student-profile-1',
    subjectId: 'subject-1',
    dailyTaskId: 'task-1',
    startedAt,
    endedAt: null,
    notes: null,
    createdAt: startedAt,
    updatedAt: startedAt,
  }
  const transaction = {
    async $queryRawUnsafe(sql: string, profileId: string) {
      calls.push(`lock:${profileId}`)
      assert.equal(sql, 'SELECT "id" FROM "student_profiles" WHERE "id" = $1::uuid FOR UPDATE')
      return [{ id: profileId }]
    },
    dailyTask: {
      async findFirst() {
        calls.push('task')
        return {
          id: 'task-1',
          studentProfileId: 'student-profile-1',
          subjectId: 'subject-1',
          status: 'PENDING',
          subject: { archivedAt: null },
        }
      },
    },
    studySession: {
      async findFirst() {
        calls.push('active')
        return null
      },
      async create(query: { data: unknown }) {
        calls.push('create')
        assert.deepEqual(query.data, {
          cancelledAt: null,
          dailyTaskId: 'task-1',
          endedAt: null,
          focusRating: null,
          isTimerManaged: true,
          notes: null,
          startedAt,
          studyQualityRating: null,
          studentProfileId: 'student-profile-1',
          subjectId: 'subject-1',
        })
        return created
      },
    },
  }
  const prisma = {
    async $transaction<T>(operation: (client: typeof transaction) => Promise<T>) {
      return operation(transaction)
    },
  } as unknown as PrismaClient

  const result = await createPrismaStudyTrackingStore(prisma)
    .startTaskSession('student-profile-1', 'task-1', startedAt)

  assert.deepEqual(calls, ['lock:student-profile-1', 'task', 'active', 'create'])
  assert.deepEqual(result, { ok: true, reused: false, value: created })
})

test('Prisma switch closes and starts intervals at one logical timestamp under the same lock', async () => {
  const calls: string[] = []
  const transitionAt = new Date('2026-09-03T08:25:00.000Z')
  const active = {
    id: 'session-a', studentProfileId: 'student-profile-1', subjectId: 'subject-a',
    dailyTaskId: 'task-a', startedAt: new Date('2026-09-03T08:00:00.000Z'),
    cancelledAt: null, endedAt: null, notes: null, createdAt: new Date('2026-09-03T08:00:00.000Z'),
    updatedAt: new Date('2026-09-03T08:00:00.000Z'),
  }
  const finished = { ...active, endedAt: transitionAt, updatedAt: transitionAt }
  const next = {
    ...active,
    id: 'session-b',
    dailyTaskId: 'task-b',
    subjectId: 'subject-b',
    startedAt: transitionAt,
    createdAt: transitionAt,
    updatedAt: transitionAt,
  }
  let findCount = 0
  const transaction = {
    async $queryRawUnsafe() {
      calls.push('lock')
      return [{ id: 'student-profile-1' }]
    },
    dailyTask: {
      async findFirst() {
        calls.push('task')
        return {
          id: 'task-b', studentProfileId: 'student-profile-1', subjectId: 'subject-b',
          status: 'PENDING', subject: { archivedAt: null },
        }
      },
    },
    studySession: {
      async findFirst() {
        findCount += 1
        calls.push(findCount === 1 ? 'active' : 'finished')
        return findCount === 1 ? active : finished
      },
      async updateMany(query: { data: { endedAt?: Date } }) {
        calls.push('finish')
        assert.equal(query.data.endedAt, transitionAt)
        return { count: 1 }
      },
      async create(query: { data: { startedAt: Date } }) {
        calls.push('create')
        assert.equal(query.data.startedAt, transitionAt)
        return next
      },
    },
  }
  const prisma = {
    async $transaction<T>(operation: (client: typeof transaction) => Promise<T>) {
      return operation(transaction)
    },
  } as unknown as PrismaClient

  const result = await createPrismaStudyTrackingStore(prisma)
    .switchTaskSession('student-profile-1', 'task-b', transitionAt)

  assert.deepEqual(calls, ['lock', 'task', 'active', 'finish', 'finished', 'create'])
  assert.deepEqual(result, {
    ok: true,
    value: { activeSession: next, cancelledSession: null, finishedSession: finished },
  })
})

test('different students lock independently and may each start one live session', async () => {
  const lockedProfiles: string[] = []
  const createdProfiles: string[] = []
  const transaction = {
    async $queryRawUnsafe(_sql: string, profileId: string) {
      lockedProfiles.push(profileId)
      return [{ id: profileId }]
    },
    dailyTask: {
      async findFirst(query: { where: { studentProfileId: string } }) {
        const profileId = query.where.studentProfileId
        return {
          id: `task-${profileId}`,
          studentProfileId: profileId,
          subjectId: null,
          status: 'PENDING',
          subject: null,
        }
      },
    },
    studySession: {
      async findFirst() { return null },
      async create(query: { data: { studentProfileId: string; startedAt: Date } }) {
        createdProfiles.push(query.data.studentProfileId)
        return {
          ...query.data,
          id: `session-${query.data.studentProfileId}`,
          createdAt: query.data.startedAt,
          updatedAt: query.data.startedAt,
        }
      },
    },
  }
  const prisma = {
    async $transaction<T>(operation: (client: typeof transaction) => Promise<T>) {
      return operation(transaction)
    },
  } as unknown as PrismaClient
  const store = createPrismaStudyTrackingStore(prisma)
  const startedAt = new Date('2026-09-03T08:00:00.000Z')

  const results = await Promise.all([
    store.startTaskSession('profile-a', 'task-profile-a', startedAt),
    store.startTaskSession('profile-b', 'task-profile-b', startedAt),
  ])

  assert.equal(results.every((result) => result.ok), true)
  assert.deepEqual(lockedProfiles.sort(), ['profile-a', 'profile-b'])
  assert.deepEqual(createdProfiles.sort(), ['profile-a', 'profile-b'])
})

test('Prisma cancellation locks the student and atomically preserves unfinished state', async () => {
  const calls: string[] = []
  const cancelledAt = new Date('2026-09-04T08:00:00.000Z')
  const active = {
    cancelledAt: null,
    createdAt: new Date('2026-09-03T20:00:00.000Z'),
    dailyTaskId: 'task-1',
    endedAt: null,
    id: 'session-1',
    notes: null,
    startedAt: new Date('2026-09-03T20:00:00.000Z'),
    studentProfileId: 'student-profile-1',
    subjectId: null,
    updatedAt: new Date('2026-09-03T20:00:00.000Z'),
  }
  const cancelled = { ...active, cancelledAt, updatedAt: cancelledAt }
  let findCount = 0
  const transaction = {
    async $queryRawUnsafe(sql: string, profileId: string) {
      calls.push('lock')
      assert.equal(sql, 'SELECT "id" FROM "student_profiles" WHERE "id" = $1::uuid FOR UPDATE')
      assert.equal(profileId, 'student-profile-1')
      return [{ id: profileId }]
    },
    studySession: {
      async findFirst(query: unknown) {
        calls.push('find')
        assert.deepEqual(query, {
          include: { pauses: { orderBy: [{ pausedAt: 'asc' }, { id: 'asc' }] } },
          where: { id: 'session-1', studentProfileId: 'student-profile-1' },
        })
        findCount += 1
        return findCount === 1 ? active : cancelled
      },
      async updateMany(query: unknown) {
        calls.push('cancel')
        assert.deepEqual(query, {
          data: { cancelledAt },
          where: {
            cancelledAt: null,
            endedAt: null,
            id: 'session-1',
            studentProfileId: 'student-profile-1',
          },
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

  const result = await createPrismaStudyTrackingStore(prisma)
    .cancelSession('student-profile-1', 'session-1', cancelledAt)

  assert.deepEqual(calls, ['lock', 'find', 'cancel', 'find'])
  assert.deepEqual(result, { ok: true, value: cancelled })
  assert.equal(cancelled.endedAt, null)
})

test('Prisma CANCEL switch cancels and starts at one logical timestamp', async () => {
  const transitionAt = new Date('2026-09-04T08:00:00.000Z')
  const active = {
    cancelledAt: null,
    createdAt: new Date('2026-09-03T20:00:00.000Z'),
    dailyTaskId: 'task-a',
    endedAt: null,
    id: 'session-a',
    notes: null,
    startedAt: new Date('2026-09-03T20:00:00.000Z'),
    studentProfileId: 'student-profile-1',
    subjectId: null,
    updatedAt: new Date('2026-09-03T20:00:00.000Z'),
  }
  const cancelled = { ...active, cancelledAt: transitionAt, updatedAt: transitionAt }
  const next = {
    ...active,
    createdAt: transitionAt,
    dailyTaskId: 'task-b',
    id: 'session-b',
    startedAt: transitionAt,
    updatedAt: transitionAt,
  }
  let findCount = 0
  const transaction = {
    async $queryRawUnsafe() { return [{ id: 'student-profile-1' }] },
    dailyTask: {
      async findFirst() {
        return {
          id: 'task-b', studentProfileId: 'student-profile-1', subjectId: null,
          status: 'PENDING', subject: null,
        }
      },
    },
    studySession: {
      async findFirst() {
        findCount += 1
        return findCount === 1 ? active : cancelled
      },
      async updateMany(query: unknown) {
        assert.deepEqual(query, {
          data: { cancelledAt: transitionAt },
          where: {
            cancelledAt: null,
            endedAt: null,
            id: 'session-a',
            studentProfileId: 'student-profile-1',
          },
        })
        return { count: 1 }
      },
      async create(query: { data: { cancelledAt: null; endedAt: null; startedAt: Date } }) {
        assert.equal(query.data.cancelledAt, null)
        assert.equal(query.data.endedAt, null)
        assert.equal(query.data.startedAt, transitionAt)
        return next
      },
    },
  }
  const prisma = {
    async $transaction<T>(operation: (client: typeof transaction) => Promise<T>) {
      return operation(transaction)
    },
  } as unknown as PrismaClient

  const result = await createPrismaStudyTrackingStore(prisma)
    .switchTaskSession('student-profile-1', 'task-b', transitionAt, 'CANCEL')

  assert.deepEqual(result, {
    ok: true,
    value: { activeSession: next, cancelledSession: cancelled, finishedSession: null },
  })
})

test('Prisma feedback update retains owner and finished lifecycle predicates at the write boundary', async () => {
  const startedAt = new Date('2026-09-03T08:00:00.000Z')
  const endedAt = new Date('2026-09-03T09:00:00.000Z')
  const session = {
    cancelledAt: null,
    createdAt: startedAt,
    dailyTaskId: 'task-1',
    endedAt,
    focusRating: null,
    id: 'session-feedback',
    notes: null,
    startedAt,
    studentProfileId: 'student-profile-1',
    studyQualityRating: null,
    subjectId: null,
    updatedAt: endedAt,
  }
  const updates: unknown[] = []
  let finds = 0
  const transaction = {
    studySession: {
      async findFirst() {
        finds += 1
        return finds === 1 ? session : { ...session, focusRating: 4 }
      },
      async updateMany(query: unknown) {
        updates.push(query)
        return { count: 1 }
      },
    },
  }
  const prisma = {
    async $transaction<T>(operation: (client: typeof transaction) => Promise<T>) {
      return operation(transaction)
    },
  } as unknown as PrismaClient

  const result = await createPrismaStudyTrackingStore(prisma)
    .updateSessionFeedback('student-profile-1', 'session-feedback', { focusRating: 4 })

  assert.equal(result.ok, true)
  assert.deepEqual(updates, [{
    data: { focusRating: 4 },
    where: {
      cancelledAt: null,
      endedAt: { not: null },
      id: 'session-feedback',
      studentProfileId: 'student-profile-1',
    },
  }])
})

test('feedback migration adds nullable columns with database rating range constraints', () => {
  const migration = readFileSync(
    '../../database/prisma/migrations/20260913200000_add_study_session_feedback/migration.sql',
    'utf8',
  )
  assert.match(migration, /ADD COLUMN "focusRating" INTEGER/)
  assert.match(migration, /ADD COLUMN "studyQualityRating" INTEGER/)
  assert.match(migration, /"focusRating" IS NULL OR "focusRating" BETWEEN 1 AND 5/)
  assert.match(migration, /"studyQualityRating" IS NULL OR "studyQualityRating" BETWEEN 1 AND 5/)
})

test('Prisma pause transition locks ownership, records server time, and marks legacy live sessions managed', async () => {
  const startedAt = new Date('2026-10-09T08:00:00.000Z')
  const pausedAt = new Date('2026-10-09T08:20:00.000Z')
  const current = {
    cancelledAt: null,
    endedAt: null,
    id: 'session-1',
    isTimerManaged: false,
    pauses: [],
    startedAt,
    studentProfileId: 'student-profile-1',
    updatedAt: startedAt,
  }
  const updated = {
    ...current,
    isTimerManaged: true,
    pauses: [{ id: 'pause-1', pausedAt, resumedAt: null, studySessionId: 'session-1' }],
    updatedAt: pausedAt,
  }
  const calls: string[] = []
  const transaction = {
    async $queryRawUnsafe() { calls.push('lock'); return [{ id: 'student-profile-1' }] },
    studySession: {
      async findFirst() { calls.push('session'); return current },
      async update(query: unknown) {
        calls.push('mark-managed')
        assert.deepEqual(query, {
          data: { isTimerManaged: true, updatedAt: pausedAt },
          include: { pauses: { orderBy: [{ pausedAt: 'asc' }, { id: 'asc' }] } },
          where: { id: 'session-1' },
        })
        return updated
      },
    },
    studySessionPause: {
      async create(query: unknown) {
        calls.push('pause')
        assert.deepEqual(query, { data: { pausedAt, studySessionId: 'session-1' } })
        return updated.pauses[0]
      },
    },
  }
  const prisma = {
    async $transaction<T>(operation: (client: typeof transaction) => Promise<T>) {
      return operation(transaction)
    },
  } as unknown as PrismaClient

  const result = await createPrismaStudyTrackingStore(prisma).pauseSession(
    'student-profile-1',
    'session-1',
    pausedAt,
    startedAt,
  )

  assert.deepEqual(calls, ['lock', 'session', 'pause', 'mark-managed'])
  assert.deepEqual(result, { ok: true, value: updated })
})

test('Prisma resume rejects a stale state before closing the authoritative open pause', async () => {
  const startedAt = new Date('2026-10-09T08:00:00.000Z')
  const current = {
    cancelledAt: null,
    endedAt: null,
    id: 'session-1',
    isTimerManaged: true,
    pauses: [{
      id: 'pause-1',
      pausedAt: new Date('2026-10-09T08:20:00.000Z'),
      resumedAt: null,
      studySessionId: 'session-1',
    }],
    startedAt,
    studentProfileId: 'student-profile-1',
    updatedAt: new Date('2026-10-09T08:20:00.000Z'),
  }
  let pauseWrites = 0
  const transaction = {
    async $queryRawUnsafe() { return [{ id: 'student-profile-1' }] },
    studySession: { async findFirst() { return current } },
    studySessionPause: { async updateMany() { pauseWrites += 1; return { count: 1 } } },
  }
  const prisma = {
    async $transaction<T>(operation: (client: typeof transaction) => Promise<T>) {
      return operation(transaction)
    },
  } as unknown as PrismaClient

  const result = await createPrismaStudyTrackingStore(prisma).resumeSession(
    'student-profile-1',
    'session-1',
    new Date('2026-10-09T08:30:00.000Z'),
    startedAt,
  )

  assert.deepEqual(result, { ok: false, reason: 'SESSION_STATE_STALE' })
  assert.equal(pauseWrites, 0)
})

test('study timer migration is additive and enforces one live session and one open pause', () => {
  const migration = readFileSync(
    '../../database/prisma/migrations/20261009090000_add_study_timer_lifecycle/migration.sql',
    'utf8',
  )
  assert.match(migration, /ADD COLUMN "isTimerManaged" BOOLEAN NOT NULL DEFAULT false/)
  assert.match(migration, /CREATE TABLE "study_session_pauses"/)
  assert.match(migration, /WHERE "endedAt" IS NULL AND "cancelledAt" IS NULL/)
  assert.match(migration, /WHERE "resumedAt" IS NULL/)
  assert.match(migration, /ON DELETE CASCADE/)
})
