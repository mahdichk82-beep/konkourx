export type DeadlineMissTaskState = {
  deadlineEligibilityStartedAt: Date
  id: string
  scheduledFor: Date
  status: 'PENDING' | 'COMPLETED' | 'PARTIAL' | 'SKIPPED'
}

type EffectiveTimeTransaction = {
  $queryRawUnsafe<T>(sql: string): Promise<T>
}

type DeadlineMissTransaction = {
  $executeRawUnsafe(sql: string, ...parameters: unknown[]): Promise<number>
}

export const captureDeadlineEffectiveAt = async (
  transaction: EffectiveTimeTransaction,
): Promise<Date> => {
  const rows = await transaction.$queryRawUnsafe<Array<{ effectiveAt: Date }>>(
    'SELECT clock_timestamp() AS "effectiveAt"',
  )
  const effectiveAt = rows[0]?.effectiveAt
  if (!(effectiveAt instanceof Date) || Number.isNaN(effectiveAt.getTime())) {
    throw new Error('Database did not return a valid deadline effective time')
  }
  return effectiveAt
}

export const recordEligibleDeadlineMiss = async (
  transaction: DeadlineMissTransaction,
  task: DeadlineMissTaskState,
  effectiveAt: Date,
): Promise<boolean> => {
  if (task.status !== 'PENDING') return false

  const inserted = await transaction.$executeRawUnsafe(
    `
      INSERT INTO "daily_task_deadline_misses"
        ("id", "dailyTaskId", "scheduledFor", "deadlineAt", "recordedAt")
      SELECT
        gen_random_uuid(),
        $1::uuid,
        $2::date,
        boundary."deadlineAt",
        $4::timestamptz
      FROM (
        SELECT (($2::date + 1)::timestamp AT TIME ZONE 'Asia/Tehran') AS "deadlineAt"
      ) AS boundary
      WHERE $3::timestamptz < boundary."deadlineAt"
        AND $4::timestamptz >= boundary."deadlineAt"
      ON CONFLICT ("dailyTaskId", "scheduledFor") DO NOTHING
    `,
    task.id,
    task.scheduledFor.toISOString().slice(0, 10),
    task.deadlineEligibilityStartedAt,
    effectiveAt,
  )

  return inserted === 1
}
