import type { PrismaClient } from '../generated/prisma/client.js'
import {
  captureDeadlineEffectiveAt,
  recordEligibleDeadlineMiss,
} from './prisma.js'

export type DeadlineMissCandidate = {
  id: string
  studentProfileId: string
}

export type DeadlineMissReconciliationStore = {
  findCandidates(limit: number): Promise<DeadlineMissCandidate[]>
  reconcileCandidate(candidate: DeadlineMissCandidate): Promise<boolean>
}

export type DeadlineMissReconciliationResult = {
  batches: number
  candidates: number
  inserted: number
  skipped: number
  stoppedBy: 'EMPTY' | 'CANDIDATE_LIMIT' | 'RUNTIME_LIMIT'
}

export type DeadlineMissReconciliationOptions = {
  batchSize?: number
  maxBatches?: number
  maxRuntimeMs?: number
  nowMs?: () => number
}

const lockStudentProfileSql =
  'SELECT "id" FROM "student_profiles" WHERE "id" = $1::uuid FOR UPDATE'

export const reconcileDeadlineMisses = async (
  store: DeadlineMissReconciliationStore,
  options: DeadlineMissReconciliationOptions = {},
): Promise<DeadlineMissReconciliationResult> => {
  const batchSize = options.batchSize ?? 100
  const maxBatches = options.maxBatches ?? 10
  const maxRuntimeMs = options.maxRuntimeMs ?? 30_000
  const nowMs = options.nowMs ?? (() => performance.now())
  const startedAt = nowMs()
  let batches = 0
  let candidates = 0
  let inserted = 0
  let skipped = 0

  while (batches < maxBatches) {
    if (nowMs() - startedAt >= maxRuntimeMs) {
      return { batches, candidates, inserted, skipped, stoppedBy: 'RUNTIME_LIMIT' }
    }

    const batch = await store.findCandidates(batchSize)
    if (batch.length === 0) {
      return { batches, candidates, inserted, skipped, stoppedBy: 'EMPTY' }
    }
    batches += 1

    for (const candidate of batch) {
      if (nowMs() - startedAt >= maxRuntimeMs) {
        return { batches, candidates, inserted, skipped, stoppedBy: 'RUNTIME_LIMIT' }
      }
      candidates += 1
      if (await store.reconcileCandidate(candidate)) inserted += 1
      else skipped += 1
    }
  }

  return { batches, candidates, inserted, skipped, stoppedBy: 'CANDIDATE_LIMIT' }
}

export const createPrismaDeadlineMissReconciliationStore = (
  prisma: PrismaClient,
): DeadlineMissReconciliationStore => ({
  async findCandidates(limit) {
    return prisma.$queryRawUnsafe<DeadlineMissCandidate[]>(
      `
        SELECT task."id", task."studentProfileId"
        FROM "daily_tasks" AS task
        WHERE task."status" = 'PENDING'
          AND task."scheduledFor" < (statement_timestamp() AT TIME ZONE 'Asia/Tehran')::date
          AND task."deadlineEligibilityStartedAt"
            < ((task."scheduledFor" + 1)::timestamp AT TIME ZONE 'Asia/Tehran')
          AND NOT EXISTS (
            SELECT 1
            FROM "daily_task_deadline_misses" AS miss
            WHERE miss."dailyTaskId" = task."id"
              AND miss."scheduledFor" = task."scheduledFor"
          )
        ORDER BY task."scheduledFor", task."id"
        LIMIT $1
      `,
      limit,
    )
  },

  async reconcileCandidate(candidate) {
    return prisma.$transaction(async (transaction) => {
      await transaction.$queryRawUnsafe(lockStudentProfileSql, candidate.studentProfileId)
      const effectiveAt = await captureDeadlineEffectiveAt(transaction)
      const task = await transaction.dailyTask.findFirst({
        select: {
          deadlineEligibilityStartedAt: true,
          id: true,
          scheduledFor: true,
          status: true,
        },
        where: { id: candidate.id, studentProfileId: candidate.studentProfileId },
      })
      if (!task) return false
      return recordEligibleDeadlineMiss(transaction, task, effectiveAt)
    })
  },
})
