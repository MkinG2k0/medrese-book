-- AlterTable
ALTER TABLE "Session" ADD COLUMN "isAdjustment" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "StepCompletion" ADD COLUMN "isPriorCredit" BOOLEAN NOT NULL DEFAULT false;

-- Backfill existing adjustment sessions
UPDATE "Session" SET "isAdjustment" = true WHERE note = 'Корректировка прогресса';

-- Backfill prior credit completions linked to adjustment sessions
UPDATE "StepCompletion" sc SET "isPriorCredit" = true
  FROM "Session" s WHERE sc."sessionId" = s.id AND s."isAdjustment" = true;
