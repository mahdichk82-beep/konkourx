-- CreateEnum
CREATE TYPE "StudentTrack" AS ENUM ('EXPERIMENTAL', 'MATHEMATICS', 'HUMANITIES');

-- AlterTable
ALTER TABLE "student_profiles" ADD COLUMN "track" "StudentTrack";
