-- AlterTable
ALTER TABLE "ExtraAssignmentCompletion" ADD COLUMN "gradedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill from createdAt for existing rows
UPDATE "ExtraAssignmentCompletion" SET "gradedAt" = "createdAt";
