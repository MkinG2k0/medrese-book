-- CreateTable
CREATE TABLE "TeachingSession" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeachingSession_teacherId_date_idx" ON "TeachingSession"("teacherId", "date");

-- CreateIndex
CREATE INDEX "TeachingSession_groupId_date_idx" ON "TeachingSession"("groupId", "date");

-- AddForeignKey
ALTER TABLE "TeachingSession" ADD CONSTRAINT "TeachingSession_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeachingSession" ADD CONSTRAINT "TeachingSession_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
