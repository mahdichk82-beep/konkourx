ALTER TABLE "daily_tasks"
ADD COLUMN "deadlineEligibilityStartedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT statement_timestamp();

CREATE TABLE "daily_task_deadline_misses" (
  "id" UUID NOT NULL,
  "dailyTaskId" UUID NOT NULL,
  "scheduledFor" DATE NOT NULL,
  "deadlineAt" TIMESTAMPTZ(3) NOT NULL,
  "recordedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "daily_task_deadline_misses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "daily_task_deadline_misses_dailyTaskId_scheduledFor_key"
ON "daily_task_deadline_misses"("dailyTaskId", "scheduledFor");

CREATE INDEX "daily_task_deadline_misses_dailyTaskId_deadlineAt_idx"
ON "daily_task_deadline_misses"("dailyTaskId", "deadlineAt");

CREATE INDEX "daily_tasks_status_scheduledFor_idx"
ON "daily_tasks"("status", "scheduledFor");

ALTER TABLE "daily_task_deadline_misses"
ADD CONSTRAINT "daily_task_deadline_misses_dailyTaskId_fkey"
FOREIGN KEY ("dailyTaskId") REFERENCES "daily_tasks"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
