-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('SUPPLIES', 'UTILITIES', 'RENT', 'OTHER');

-- CreateEnum
CREATE TYPE "SalaryAccrualStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'PAID');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ACCOUNTANT';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "discountReason" TEXT,
ADD COLUMN     "tuitionRate" INTEGER NOT NULL DEFAULT 200000;

-- CreateTable
CREATE TABLE "TuitionCharge" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TuitionCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TuitionPayment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "comment" TEXT,
    "createdById" TEXT NOT NULL,
    "reversalOfId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TuitionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherRate" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "hourlyRate" INTEGER NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeachingSessionDurationAdjustment" (
    "id" TEXT NOT NULL,
    "teachingSessionId" TEXT NOT NULL,
    "originalMinutes" INTEGER NOT NULL,
    "adjustedMinutes" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "adjustedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeachingSessionDurationAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryAccrual" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "totalMinutes" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "SalaryAccrualStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryAccrual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryPayout" (
    "id" TEXT NOT NULL,
    "accrualId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "comment" TEXT,
    "createdById" TEXT NOT NULL,
    "reversalOfId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaryPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "comment" TEXT,
    "createdById" TEXT NOT NULL,
    "reversalOfId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "comment" TEXT,
    "createdById" TEXT NOT NULL,
    "reversalOfId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthClose" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedById" TEXT NOT NULL,

    CONSTRAINT "MonthClose_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TuitionCharge_month_idx" ON "TuitionCharge"("month");

-- CreateIndex
CREATE UNIQUE INDEX "TuitionCharge_studentId_month_key" ON "TuitionCharge"("studentId", "month");

-- CreateIndex
CREATE INDEX "TuitionPayment_studentId_date_idx" ON "TuitionPayment"("studentId", "date");

-- CreateIndex
CREATE INDEX "TuitionPayment_date_idx" ON "TuitionPayment"("date");

-- CreateIndex
CREATE INDEX "TeacherRate_teacherId_validFrom_idx" ON "TeacherRate"("teacherId", "validFrom");

-- CreateIndex
CREATE UNIQUE INDEX "TeachingSessionDurationAdjustment_teachingSessionId_key" ON "TeachingSessionDurationAdjustment"("teachingSessionId");

-- CreateIndex
CREATE INDEX "SalaryAccrual_month_status_idx" ON "SalaryAccrual"("month", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryAccrual_teacherId_month_key" ON "SalaryAccrual"("teacherId", "month");

-- CreateIndex
CREATE INDEX "SalaryPayout_accrualId_idx" ON "SalaryPayout"("accrualId");

-- CreateIndex
CREATE INDEX "SalaryPayout_date_idx" ON "SalaryPayout"("date");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "Donation_date_idx" ON "Donation"("date");

-- CreateIndex
CREATE UNIQUE INDEX "MonthClose_month_key" ON "MonthClose"("month");

-- AddForeignKey
ALTER TABLE "TuitionCharge" ADD CONSTRAINT "TuitionCharge_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TuitionPayment" ADD CONSTRAINT "TuitionPayment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TuitionPayment" ADD CONSTRAINT "TuitionPayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TuitionPayment" ADD CONSTRAINT "TuitionPayment_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "TuitionPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherRate" ADD CONSTRAINT "TeacherRate_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingSessionDurationAdjustment" ADD CONSTRAINT "TeachingSessionDurationAdjustment_teachingSessionId_fkey" FOREIGN KEY ("teachingSessionId") REFERENCES "TeachingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingSessionDurationAdjustment" ADD CONSTRAINT "TeachingSessionDurationAdjustment_adjustedById_fkey" FOREIGN KEY ("adjustedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryAccrual" ADD CONSTRAINT "SalaryAccrual_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryPayout" ADD CONSTRAINT "SalaryPayout_accrualId_fkey" FOREIGN KEY ("accrualId") REFERENCES "SalaryAccrual"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryPayout" ADD CONSTRAINT "SalaryPayout_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryPayout" ADD CONSTRAINT "SalaryPayout_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "SalaryPayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "Donation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthClose" ADD CONSTRAINT "MonthClose_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
