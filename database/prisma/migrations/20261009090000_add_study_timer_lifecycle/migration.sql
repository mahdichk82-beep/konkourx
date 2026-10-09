-- Abort instead of silently reconciling historical duplicate live sessions.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "study_sessions"
    WHERE "endedAt" IS NULL AND "cancelledAt" IS NULL
    GROUP BY "studentProfileId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot add live-session uniqueness: duplicate active StudySessions exist';
  END IF;
END $$;

-- AlterTable
ALTER TABLE "study_sessions"
ADD COLUMN "isTimerManaged" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "study_session_pauses" (
    "id" UUID NOT NULL,
    "studySessionId" UUID NOT NULL,
    "pausedAt" TIMESTAMP(3) NOT NULL,
    "resumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_session_pauses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_session_pauses_studySessionId_pausedAt_idx"
ON "study_session_pauses"("studySessionId", "pausedAt");

-- One unfinished, non-cancelled session per Student, including paused sessions.
CREATE UNIQUE INDEX "study_sessions_one_live_per_student_idx"
ON "study_sessions"("studentProfileId")
WHERE "endedAt" IS NULL AND "cancelledAt" IS NULL;

-- One current pause per session; completed pause history remains unlimited.
CREATE UNIQUE INDEX "study_session_pauses_one_open_per_session_idx"
ON "study_session_pauses"("studySessionId")
WHERE "resumedAt" IS NULL;

-- AddForeignKey
ALTER TABLE "study_session_pauses"
ADD CONSTRAINT "study_session_pauses_studySessionId_fkey"
FOREIGN KEY ("studySessionId") REFERENCES "study_sessions"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
