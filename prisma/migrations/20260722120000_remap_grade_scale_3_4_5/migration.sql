-- Remap grade scale 1/3/5 → 3/4/5 (Средне / Хорошо / Отлично).
-- Single-pass CASE per table — do not chain equality UPDATEs (would corrupt remapped «Средне»).

UPDATE "StepCompletion"
SET "grade" = CASE
  WHEN "grade" = 1 THEN 3
  WHEN "grade" = 3 THEN 4
  ELSE "grade"
END
WHERE "grade" IN (1, 3);

UPDATE "ExtraAssignmentCompletion"
SET "grade" = CASE
  WHEN "grade" = 1 THEN 3
  WHEN "grade" = 3 THEN 4
  ELSE "grade"
END
WHERE "grade" IN (1, 3);
