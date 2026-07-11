-- AlterTable
ALTER TABLE "Step" ADD COLUMN     "teacherNote" JSONB NOT NULL DEFAULT '{"blocks":[]}';
