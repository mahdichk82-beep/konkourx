import assert from 'node:assert/strict'
import test from 'node:test'
import type { PrismaClient } from '../src/generated/prisma/client.js'
import {
  createPrismaDeadlineMissReconciliationStore,
  reconcileDeadlineMisses,
} from '../src/task-deadline-misses/reconciler.js'

const candidate = (suffix: number) => ({
  id: `60000000-0000-4000-8000-${String(suffix).padStart(12, '0')}`,
  studentProfileId: '30000000-0000-4000-8000-000000000001',
})

test('reconciliation drains bounded batches and reports inserted and raced candidates', async () => {
  const batches = [[candidate(1), candidate(2)], []]
  const reconciled: string[] = []
  const result = await reconcileDeadlineMisses({
    async findCandidates(limit) {
      assert.equal(limit, 100)
      return batches.shift() ?? []
    },
    async reconcileCandidate(value) {
      reconciled.push(value.id)
      return value.id.endsWith('1')
    },
  }, { nowMs: () => 0 })

  assert.deepEqual(result, {
    batches: 1,
    candidates: 2,
    inserted: 1,
    skipped: 1,
    stoppedBy: 'EMPTY',
  })
  assert.deepEqual(reconciled, [candidate(1).id, candidate(2).id])
})

test('reconciliation stops at one thousand candidates even when backlog remains', async () => {
  let batch = 0
  const result = await reconcileDeadlineMisses({
    async findCandidates() {
      batch += 1
      return Array.from({ length: 100 }, (_, index) => candidate(batch * 100 + index))
    },
    async reconcileCandidate() { return true },
  }, { nowMs: () => 0 })

  assert.equal(batch, 10)
  assert.equal(result.candidates, 1000)
  assert.equal(result.stoppedBy, 'CANDIDATE_LIMIT')
})

test('reconciliation stops safely when its runtime budget expires mid-batch', async () => {
  const times = [0, 0, 0, 30_000]
  const reconciled: string[] = []
  const result = await reconcileDeadlineMisses({
    async findCandidates() { return [candidate(1), candidate(2)] },
    async reconcileCandidate(value) {
      reconciled.push(value.id)
      return true
    },
  }, { nowMs: () => times.shift() ?? 30_000 })

  assert.deepEqual(reconciled, [candidate(1).id])
  assert.deepEqual(result, {
    batches: 1,
    candidates: 1,
    inserted: 1,
    skipped: 0,
    stoppedBy: 'RUNTIME_LIMIT',
  })
})

test('Prisma reconciliation uses an indexed Tehran candidate query and rechecks under the student lock', async () => {
  const queries: Array<{ parameters: unknown[]; sql: string }> = []
  const effectiveAt = new Date('2026-10-10T20:31:00.000Z')
  const task = {
    deadlineEligibilityStartedAt: new Date('2026-10-09T08:00:00.000Z'),
    id: candidate(1).id,
    scheduledFor: new Date('2026-10-09T00:00:00.000Z'),
    status: 'PENDING' as const,
  }
  const transaction = {
    async $queryRawUnsafe(sql: string) {
      if (sql.includes('FOR UPDATE')) return [{ id: candidate(1).studentProfileId }]
      return [{ effectiveAt }]
    },
    async $executeRawUnsafe() { return 1 },
    dailyTask: { findFirst: async () => task },
  }
  const prisma = {
    async $queryRawUnsafe(sql: string, ...parameters: unknown[]) {
      queries.push({ parameters, sql })
      return [candidate(1)]
    },
    $transaction: async <T>(operation: (client: typeof transaction) => Promise<T>) => operation(transaction),
  } as unknown as PrismaClient
  const store = createPrismaDeadlineMissReconciliationStore(prisma)

  assert.deepEqual(await store.findCandidates(100), [candidate(1)])
  assert.equal(await store.reconcileCandidate(candidate(1)), true)
  assert.deepEqual(queries[0]!.parameters, [100])
  assert.match(queries[0]!.sql, /"status" = 'PENDING'/)
  assert.match(queries[0]!.sql, /statement_timestamp\(\)/)
  assert.doesNotMatch(queries[0]!.sql, /clock_timestamp\(\)/)
  assert.match(queries[0]!.sql, /AT TIME ZONE 'Asia\/Tehran'/)
  assert.match(queries[0]!.sql, /NOT EXISTS/)
  assert.match(queries[0]!.sql, /ORDER BY task\."scheduledFor", task\."id"/)
})
