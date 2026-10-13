import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  captureDeadlineEffectiveAt,
  recordEligibleDeadlineMiss,
} from '../src/task-deadline-misses/prisma.js'

const task = {
  deadlineEligibilityStartedAt: new Date('2026-10-10T12:00:00.000Z'),
  id: '60000000-0000-4000-8000-000000000001',
  scheduledFor: new Date('2026-10-10T00:00:00.000Z'),
  status: 'PENDING' as const,
}

test('deadline effective time uses wall clock after locking instead of transaction-start time', async () => {
  const queries: string[] = []
  const effectiveAt = new Date('2026-10-10T20:30:00.000Z')
  const transaction = {
    async $queryRawUnsafe(sql: string) {
      queries.push(sql)
      return [{ effectiveAt }]
    },
  }

  assert.equal(await captureDeadlineEffectiveAt(transaction), effectiveAt)
  assert.equal(queries.length, 1)
  assert.match(queries[0]!, /clock_timestamp\(\)/i)
  assert.doesNotMatch(queries[0]!, /\b(?:now|current_timestamp)\s*\(/i)
})

test('deadline insertion delegates the Tehran boundary and idempotency to PostgreSQL', async () => {
  const calls: Array<{ parameters: unknown[]; sql: string }> = []
  const effectiveAt = new Date('2026-10-10T20:30:00.000Z')
  const transaction = {
    async $executeRawUnsafe(sql: string, ...parameters: unknown[]) {
      calls.push({ parameters, sql })
      return 1
    },
  }

  assert.equal(await recordEligibleDeadlineMiss(transaction, task, effectiveAt), true)
  assert.equal(calls.length, 1)
  assert.match(calls[0]!.sql, /AT TIME ZONE 'Asia\/Tehran'/)
  assert.match(calls[0]!.sql, /ON CONFLICT \("dailyTaskId", "scheduledFor"\) DO NOTHING/)
  assert.deepEqual(calls[0]!.parameters, [
    task.id,
    '2026-10-10',
    task.deadlineEligibilityStartedAt,
    effectiveAt,
  ])
})

test('missed-deadline migration is additive, immutable, and does not backfill history', async () => {
  const migration = await readFile(
    new URL(
      '../../../database/prisma/migrations/20261014010000_add_daily_task_deadline_misses/migration.sql',
      import.meta.url,
    ),
    'utf8',
  )

  assert.match(migration, /ADD COLUMN "deadlineEligibilityStartedAt" TIMESTAMPTZ\(3\) NOT NULL DEFAULT statement_timestamp\(\)/)
  assert.match(migration, /CREATE TABLE "daily_task_deadline_misses"/)
  assert.match(migration, /CREATE UNIQUE INDEX "daily_task_deadline_misses_dailyTaskId_scheduledFor_key"/)
  assert.match(migration, /CREATE INDEX "daily_tasks_status_scheduledFor_idx"/)
  assert.match(migration, /ON DELETE CASCADE/)
  assert.doesNotMatch(migration, /^\s*(?:INSERT\s+INTO|UPDATE\s+\S+\s+SET|DELETE\s+FROM)\b/im)
})
