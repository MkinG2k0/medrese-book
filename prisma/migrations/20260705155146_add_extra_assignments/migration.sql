-- CreateTable
CREATE TABLE "ExtraAssignment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "stepId" TEXT,
    "authorId" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtraAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentExtraAssignment" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "displayStepId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentExtraAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtraAssignmentCompletion" (
    "id" TEXT NOT NULL,
    "studentExtraAssignmentId" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExtraAssignmentCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExtraAssignment_authorId_idx" ON "ExtraAssignment"("authorId");

-- CreateIndex
CREATE INDEX "ExtraAssignment_stepId_idx" ON "ExtraAssignment"("stepId");

-- CreateIndex
CREATE INDEX "StudentExtraAssignment_sessionId_displayStepId_idx" ON "StudentExtraAssignment"("sessionId", "displayStepId");

-- CreateIndex
CREATE INDEX "StudentExtraAssignment_studentId_idx" ON "StudentExtraAssignment"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExtraAssignmentCompletion_studentExtraAssignmentId_key" ON "ExtraAssignmentCompletion"("studentExtraAssignmentId");

-- AddForeignKey
ALTER TABLE "ExtraAssignment" ADD CONSTRAINT "ExtraAssignment_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "Step"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraAssignment" ADD CONSTRAINT "ExtraAssignment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExtraAssignment" ADD CONSTRAINT "StudentExtraAssignment_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ExtraAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExtraAssignment" ADD CONSTRAINT "StudentExtraAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExtraAssignment" ADD CONSTRAINT "StudentExtraAssignment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExtraAssignment" ADD CONSTRAINT "StudentExtraAssignment_displayStepId_fkey" FOREIGN KEY ("displayStepId") REFERENCES "Step"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentExtraAssignment" ADD CONSTRAINT "StudentExtraAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraAssignmentCompletion" ADD CONSTRAINT "ExtraAssignmentCompletion_studentExtraAssignmentId_fkey" FOREIGN KEY ("studentExtraAssignmentId") REFERENCES "StudentExtraAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
