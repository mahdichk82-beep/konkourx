ALTER TABLE "daily_tasks"
ADD COLUMN "actualSolvedTestCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "daily_tasks"
ADD CONSTRAINT "daily_tasks_actualSolvedTestCount_nonnegative"
CHECK ("actualSolvedTestCount" >= 0);
