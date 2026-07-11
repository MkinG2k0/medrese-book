-- GroupEnrollment: enrollment-scoped progress (D-01, D-02)
ALTER TABLE "GroupEnrollment" ADD COLUMN "currentStepIdx" INTEGER NOT NULL DEFAULT 0;

-- D-06: primary enrollment (MIN enrolledAt per student) inherits legacy Student.currentStepIdx
UPDATE "GroupEnrollment" ge
SET "currentStepIdx" = s."currentStepIdx"
FROM "Student" s
WHERE ge."studentId" = s."id"
  AND ge."id" = (
    SELECT ge2."id"
    FROM "GroupEnrollment" ge2
    WHERE ge2."studentId" = s."id"
    ORDER BY ge2."enrolledAt" ASC, ge2."id" ASC
    LIMIT 1
  );

-- D-07: non-primary enrollments start at subject-scoped level offset (sum of prior level step counts)
WITH level_step_counts AS (
  SELECT
    l."id" AS "levelId",
    l."subjectId",
    l."number",
    COUNT(s."id")::int AS step_count
  FROM "Level" l
  LEFT JOIN "Step" s ON s."levelId" = l."id"
  GROUP BY l."id", l."subjectId", l."number"
),
level_offsets AS (
  SELECT
    lsc."levelId",
    COALESCE(
      (
        SELECT SUM(lsc2.step_count)
        FROM level_step_counts lsc2
        WHERE lsc2."subjectId" = lsc."subjectId"
          AND lsc2."number" < lsc."number"
      ),
      0
    )::int AS step_offset
  FROM level_step_counts lsc
)
UPDATE "GroupEnrollment" ge
SET "currentStepIdx" = lo.step_offset
FROM level_offsets lo
WHERE ge."levelId" = lo."levelId"
  AND ge."id" NOT IN (
    SELECT DISTINCT ON (ge2."studentId") ge2."id"
    FROM "GroupEnrollment" ge2
    ORDER BY ge2."studentId", ge2."enrolledAt" ASC, ge2."id" ASC
  );

-- Session.groupId: nullable add, backfill, then NOT NULL (D-04, T-12-01 two-step)
ALTER TABLE "Session" ADD COLUMN "groupId" TEXT;

-- Backfill: primary enrollment group per student; fallback TeachingSession same calendar day; fallback first DEFAULT_QURAN group
UPDATE "Session" sess
SET "groupId" = COALESCE(
  (
    SELECT ge."groupId"
    FROM "GroupEnrollment" ge
    WHERE ge."studentId" = sess."studentId"
    ORDER BY ge."enrolledAt" ASC, ge."id" ASC
    LIMIT 1
  ),
  (
    SELECT ts."groupId"
    FROM "TeachingSession" ts
    WHERE ts."date"::date = sess."date"::date
    ORDER BY ts."startedAt" ASC
    LIMIT 1
  ),
  (
    SELECT g."id"
    FROM "Group" g
    WHERE g."subjectId" = 'clq10defaultquransubject00'
    ORDER BY g."id" ASC
    LIMIT 1
  )
);

-- Adjustment sessions colliding with a regular session on same student+day+group:
-- reassign to a secondary enrollment group when available (plan 12-02 scopes adjustment per group)
UPDATE "Session" adj
SET "groupId" = (
  SELECT ge."groupId"
  FROM "GroupEnrollment" ge
  WHERE ge."studentId" = adj."studentId"
    AND ge."groupId" IS DISTINCT FROM adj."groupId"
  ORDER BY ge."enrolledAt" ASC, ge."id" ASC
  LIMIT 1
)
WHERE adj."isAdjustment" = true
  AND EXISTS (
    SELECT 1
    FROM "Session" other
    WHERE other."studentId" = adj."studentId"
      AND other."date"::date = adj."date"::date
      AND other."groupId" = adj."groupId"
      AND other."id" <> adj."id"
      AND other."isAdjustment" = false
  )
  AND EXISTS (
    SELECT 1
    FROM "GroupEnrollment" ge
    WHERE ge."studentId" = adj."studentId"
      AND ge."groupId" IS DISTINCT FROM adj."groupId"
  );

ALTER TABLE "Session" ALTER COLUMN "groupId" SET NOT NULL;

ALTER TABLE "Session" ADD CONSTRAINT "Session_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Session_studentId_date_groupId_key" ON "Session"("studentId", "date", "groupId");

CREATE INDEX "Session_groupId_date_idx" ON "Session"("groupId", "date");

-- D-03: drop global progress column after backfill
ALTER TABLE "Student" DROP COLUMN "currentStepIdx";
