ALTER TABLE "Session" ADD COLUMN "absenceExcused" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Session" ADD COLUMN "absenceReason" TEXT;
