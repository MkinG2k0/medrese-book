-- Expand: add nullable month, Moscow backfill, then NOT NULL + indexes
ALTER TABLE "TuitionPayment" ADD COLUMN "month" TEXT;

UPDATE "TuitionPayment"
SET "month" = to_char(("date" AT TIME ZONE 'Europe/Moscow'), 'YYYY-MM');

ALTER TABLE "TuitionPayment" ALTER COLUMN "month" SET NOT NULL;

ALTER TABLE "TuitionPaymentRequest" ADD COLUMN "month" TEXT;

UPDATE "TuitionPaymentRequest"
SET "month" = to_char(("createdAt" AT TIME ZONE 'Europe/Moscow'), 'YYYY-MM');

ALTER TABLE "TuitionPaymentRequest" ALTER COLUMN "month" SET NOT NULL;

CREATE INDEX "TuitionPayment_studentId_month_idx" ON "TuitionPayment"("studentId", "month");

CREATE INDEX "TuitionPaymentRequest_month_idx" ON "TuitionPaymentRequest"("month");
