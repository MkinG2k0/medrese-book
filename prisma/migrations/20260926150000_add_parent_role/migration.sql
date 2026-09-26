-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'PARENT';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN "parentId" TEXT;

-- CreateIndex
CREATE INDEX "Student_parentId_idx" ON "Student"("parentId");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
