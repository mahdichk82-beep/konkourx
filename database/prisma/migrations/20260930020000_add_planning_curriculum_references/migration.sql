-- CreateEnum
CREATE TYPE "CurriculumReferenceKind" AS ENUM ('NODE', 'PLACEMENT');

-- CreateEnum
CREATE TYPE "CurriculumSelectionMode" AS ENUM ('EXACT', 'WHOLE');

-- AlterEnum
ALTER TYPE "DailyTaskStatus" ADD VALUE 'PARTIAL';

-- AlterTable
ALTER TABLE "daily_tasks" ADD COLUMN "partialAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "daily_task_curriculum_targets" (
    "id" UUID NOT NULL,
    "dailyTaskId" UUID NOT NULL,
    "referenceKind" "CurriculumReferenceKind" NOT NULL,
    "curriculumRefId" TEXT NOT NULL,
    "selectionMode" "CurriculumSelectionMode" NOT NULL,
    "position" INTEGER NOT NULL,
    "labelSnapshot" TEXT NOT NULL,
    "pathSnapshot" TEXT[],
    "representationIdSnapshot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_task_curriculum_targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_task_curriculum_items" (
    "id" UUID NOT NULL,
    "targetId" UUID NOT NULL,
    "dailyTaskId" UUID NOT NULL,
    "referenceKind" "CurriculumReferenceKind" NOT NULL,
    "curriculumRefId" TEXT NOT NULL,
    "labelSnapshot" TEXT NOT NULL,
    "pathSnapshot" TEXT[],
    "position" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_task_curriculum_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "daily_task_curriculum_targets_dailyTaskId_idx" ON "daily_task_curriculum_targets"("dailyTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_task_curriculum_targets_dailyTaskId_position_key" ON "daily_task_curriculum_targets"("dailyTaskId", "position");

-- CreateIndex
CREATE INDEX "daily_task_curriculum_items_targetId_position_idx" ON "daily_task_curriculum_items"("targetId", "position");

-- CreateIndex
CREATE INDEX "daily_task_curriculum_items_dailyTaskId_completedAt_idx" ON "daily_task_curriculum_items"("dailyTaskId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "daily_task_curriculum_items_dailyTaskId_position_key" ON "daily_task_curriculum_items"("dailyTaskId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "daily_task_curriculum_items_dailyTaskId_referenceKind_curri_key" ON "daily_task_curriculum_items"("dailyTaskId", "referenceKind", "curriculumRefId");

-- AddForeignKey
ALTER TABLE "daily_task_curriculum_targets" ADD CONSTRAINT "daily_task_curriculum_targets_dailyTaskId_fkey" FOREIGN KEY ("dailyTaskId") REFERENCES "daily_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_task_curriculum_items" ADD CONSTRAINT "daily_task_curriculum_items_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "daily_task_curriculum_targets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_task_curriculum_items" ADD CONSTRAINT "daily_task_curriculum_items_dailyTaskId_fkey" FOREIGN KEY ("dailyTaskId") REFERENCES "daily_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enforce server-owned lifecycle timestamps and terminal-state consistency.
ALTER TABLE "daily_tasks" ADD CONSTRAINT "daily_tasks_lifecycle_consistency_check" CHECK (
  ("status" = 'PENDING' AND "completedAt" IS NULL AND "partialAt" IS NULL AND "skippedAt" IS NULL AND "skipReason" IS NULL)
  OR ("status" = 'COMPLETED' AND "completedAt" IS NOT NULL AND "partialAt" IS NULL AND "skippedAt" IS NULL AND "skipReason" IS NULL)
  OR ("status" = 'PARTIAL' AND "completedAt" IS NULL AND "partialAt" IS NOT NULL AND "skippedAt" IS NULL AND "skipReason" IS NULL)
  OR ("status" = 'SKIPPED' AND "completedAt" IS NULL AND "partialAt" IS NULL AND "skippedAt" IS NOT NULL)
);
