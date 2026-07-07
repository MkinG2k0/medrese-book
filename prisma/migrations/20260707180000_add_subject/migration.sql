-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- Default Quran subject for backfill (id must match prisma/lib/subject-constants.ts)
INSERT INTO "Subject" ("id", "name", "description", "createdAt", "updatedAt")
VALUES ('clq10defaultquransubject00', 'Коран', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable: add nullable subjectId, backfill, then enforce NOT NULL
ALTER TABLE "Level" ADD COLUMN "subjectId" TEXT;

UPDATE "Level" SET "subjectId" = 'clq10defaultquransubject00';

ALTER TABLE "Level" ALTER COLUMN "subjectId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Level" ADD CONSTRAINT "Level_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropIndex
DROP INDEX IF EXISTS "Level_number_key";

-- CreateIndex
CREATE UNIQUE INDEX "Level_subjectId_number_key" ON "Level"("subjectId", "number");

-- CreateIndex
CREATE INDEX "Level_subjectId_idx" ON "Level"("subjectId");
