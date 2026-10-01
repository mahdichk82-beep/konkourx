-- Preserve date-only legacy tasks while allowing new tasks to occupy exact
-- 15-minute positions in the same scheduled day.
ALTER TABLE "daily_tasks"
ADD COLUMN "startMinuteOfDay" SMALLINT,
ADD COLUMN "endMinuteOfDay" SMALLINT;

ALTER TABLE "daily_tasks"
ADD CONSTRAINT "daily_tasks_schedule_window_check"
CHECK (
  ("startMinuteOfDay" IS NULL AND "endMinuteOfDay" IS NULL)
  OR (
    "startMinuteOfDay" IS NOT NULL
    AND "endMinuteOfDay" IS NOT NULL
    AND "startMinuteOfDay" >= 0
    AND "startMinuteOfDay" < 1440
    AND "endMinuteOfDay" > 0
    AND "endMinuteOfDay" <= 1440
    AND MOD("startMinuteOfDay", 15) = 0
    AND MOD("endMinuteOfDay", 15) = 0
    AND "startMinuteOfDay" < "endMinuteOfDay"
  )
);
