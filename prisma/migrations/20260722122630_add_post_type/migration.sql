-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('GENERAL', 'SYSTEM');

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "type" "PostType" NOT NULL DEFAULT 'GENERAL';
