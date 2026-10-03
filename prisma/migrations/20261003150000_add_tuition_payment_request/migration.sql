-- CreateEnum
CREATE TYPE "TuitionPaymentRequestStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- CreateTable
CREATE TABLE "TuitionPaymentRequest" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "status" "TuitionPaymentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TuitionPaymentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TuitionPaymentRequestLine" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paymentId" TEXT,

    CONSTRAINT "TuitionPaymentRequestLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TuitionPaymentRequest_parentId_status_idx" ON "TuitionPaymentRequest"("parentId", "status");

-- CreateIndex
CREATE INDEX "TuitionPaymentRequest_status_createdAt_idx" ON "TuitionPaymentRequest"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TuitionPaymentRequestLine_paymentId_key" ON "TuitionPaymentRequestLine"("paymentId");

-- CreateIndex
CREATE INDEX "TuitionPaymentRequestLine_studentId_idx" ON "TuitionPaymentRequestLine"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "TuitionPaymentRequestLine_requestId_studentId_key" ON "TuitionPaymentRequestLine"("requestId", "studentId");

-- AddForeignKey
ALTER TABLE "TuitionPaymentRequest" ADD CONSTRAINT "TuitionPaymentRequest_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TuitionPaymentRequest" ADD CONSTRAINT "TuitionPaymentRequest_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TuitionPaymentRequestLine" ADD CONSTRAINT "TuitionPaymentRequestLine_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "TuitionPaymentRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TuitionPaymentRequestLine" ADD CONSTRAINT "TuitionPaymentRequestLine_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TuitionPaymentRequestLine" ADD CONSTRAINT "TuitionPaymentRequestLine_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "TuitionPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;