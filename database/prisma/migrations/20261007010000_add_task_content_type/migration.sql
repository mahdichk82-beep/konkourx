CREATE TYPE "TaskContentType" AS ENUM ('STUDY', 'GENERAL');

ALTER TABLE "daily_tasks" ADD COLUMN "contentType" "TaskContentType";
