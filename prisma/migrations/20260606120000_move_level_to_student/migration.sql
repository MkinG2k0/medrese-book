-- Add levelId to Student (nullable for data migration)
ALTER TABLE "Student" ADD COLUMN "levelId" TEXT;

-- Copy level from group to each student
UPDATE "Student" s
SET "levelId" = g."levelId"
FROM "Group" g
WHERE s."groupId" = g.id;

-- Fallback: assign first level if any student still has null
UPDATE "Student"
SET "levelId" = (SELECT id FROM "Level" ORDER BY "number" ASC LIMIT 1)
WHERE "levelId" IS NULL;

-- Make levelId required and add FK
ALTER TABLE "Student" ALTER COLUMN "levelId" SET NOT NULL;
ALTER TABLE "Student" ADD CONSTRAINT "Student_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "Level"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Remove level from Group
ALTER TABLE "Group" DROP CONSTRAINT "Group_levelId_fkey";
ALTER TABLE "Group" DROP COLUMN "levelId";
