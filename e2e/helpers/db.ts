import pg from "pg";

import { loadTestEnv } from "./load-test-env";

let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!pool) {
    loadTestEnv();
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set in .env.test");
    }
    pool = new pg.Pool({ connectionString });
  }
  return pool;
}

export async function getGroupIdByName(name: string): Promise<string> {
  const result = await getPool().query<{ id: string }>(
    `SELECT id FROM "Group" WHERE name = $1 LIMIT 1`,
    [name],
  );
  const group = result.rows[0];
  if (!group) {
    throw new Error(`Group not found: ${name}`);
  }
  return group.id;
}

export async function getStudentIdByCode(code: string): Promise<string> {
  const result = await getPool().query<{ id: string }>(
    `
      SELECT s.id
      FROM "Student" s
      INNER JOIN "User" u ON u.id = s."userId"
      WHERE u.code = $1
      LIMIT 1
    `,
    [code],
  );
  const student = result.rows[0];
  if (!student) {
    throw new Error(`Student not found for code: ${code}`);
  }
  return student.id;
}

export async function getStudentCurrentStepIdx(studentId: string): Promise<number> {
  const result = await getPool().query<{ currentStepIdx: number }>(
    `SELECT "currentStepIdx" FROM "Student" WHERE id = $1 LIMIT 1`,
    [studentId],
  );
  const student = result.rows[0];
  if (!student) {
    throw new Error(`Student not found: ${studentId}`);
  }
  return student.currentStepIdx;
}

export async function countStudentCountableCompletionsInMonth(
  studentId: string,
  monthStart: Date,
  monthEnd: Date,
): Promise<number> {
  const result = await getPool().query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM "StepCompletion"
      WHERE "studentId" = $1
        AND "isPriorCredit" = false
        AND "createdAt" >= $2
        AND "createdAt" <= $3
    `,
    [studentId, monthStart.toISOString(), monthEnd.toISOString()],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function countStudentPriorCreditCompletions(
  studentId: string,
): Promise<number> {
  const result = await getPool().query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM "StepCompletion"
      WHERE "studentId" = $1 AND "isPriorCredit" = true
    `,
    [studentId],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function countStudentAdjustmentSessionsInMonth(
  studentId: string,
  monthStart: Date,
  monthEnd: Date,
): Promise<number> {
  const result = await getPool().query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM "Session"
      WHERE "studentId" = $1
        AND "isAdjustment" = true
        AND date >= $2
        AND date <= $3
    `,
    [studentId, monthStart.toISOString(), monthEnd.toISOString()],
  );
  return Number(result.rows[0]?.count ?? 0);
}

/** Read-only AuditEvent count; returns 0 until FND-04 migration (plan 05). */
export async function countAuditEvents(action?: string): Promise<number> {
  try {
    const result = action
      ? await getPool().query<{ count: string }>(
          `SELECT COUNT(*)::text AS count FROM "AuditEvent" WHERE action = $1`,
          [action],
        )
      : await getPool().query<{ count: string }>(
          `SELECT COUNT(*)::text AS count FROM "AuditEvent"`,
        );
    return Number(result.rows[0]?.count ?? 0);
  } catch {
    return 0;
  }
}
