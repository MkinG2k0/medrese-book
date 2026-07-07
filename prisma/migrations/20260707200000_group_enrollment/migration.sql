-- AlterTable: add nullable subjectId, backfill Quran subject, then enforce NOT NULL
ALTER TABLE "Group" ADD COLUMN "subjectId" TEXT;

UPDATE "Group" SET "subjectId" = 'clq10defaultquransubject00';

ALTER TABLE "Group" ALTER COLUMN "subjectId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Group_subjectId_idx" ON "Group"("subjectId");

-- CreateTable
CREATE TABLE "GroupEnrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "levelId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupEnrollment_groupId_idx" ON "GroupEnrollment"("groupId");

-- CreateIndex
CREATE INDEX "GroupEnrollment_studentId_idx" ON "GroupEnrollment"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupEnrollment_studentId_groupId_key" ON "GroupEnrollment"("studentId", "groupId");

-- AddForeignKey
ALTER TABLE "GroupEnrollment" ADD CONSTRAINT "GroupEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupEnrollment" ADD CONSTRAINT "GroupEnrollment_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupEnrollment" ADD CONSTRAINT "GroupEnrollment_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill enrollments from legacy Student.groupId/levelId before column drop
INSERT INTO "GroupEnrollment" ("id", "studentId", "groupId", "levelId", "enrolledAt")
SELECT gen_random_uuid()::text, "id", "groupId", "levelId", CURRENT_TIMESTAMP
FROM "Student"
WHERE "groupId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_groupId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_levelId_fkey";

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "groupId",
DROP COLUMN "levelId";
