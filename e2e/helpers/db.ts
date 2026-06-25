import fs from "node:fs";
import path from "node:path";

import pg from "pg";
import dotenv from "dotenv";

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

export async function setStudentStatus(
  studentId: string,
  status: "ACTIVE" | "PAUSE" | "ARCHIVE",
): Promise<void> {
  await getPool().query(
    `UPDATE "Student" SET status = $2::"StudentStatus" WHERE id = $1`,
    [studentId, status],
  );
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

/** Read-only AuditEvent count for e2e assertions. */
export async function countAuditEvents(
  action?: string,
  entityId?: string,
): Promise<number> {
  if (action && entityId) {
    const result = await getPool().query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM "AuditEvent" WHERE action = $1 AND "entityId" = $2`,
      [action, entityId],
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  if (action) {
    const result = await getPool().query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM "AuditEvent" WHERE action = $1`,
      [action],
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  const result = await getPool().query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM "AuditEvent"`,
  );
  return Number(result.rows[0]?.count ?? 0);
}

async function ignoreMissingRelation(error: unknown): Promise<boolean> {
  return (
    error instanceof Error &&
    (error.message.includes("does not exist") ||
      error.message.includes("Connection terminated"))
  );
}

export async function getLatestAuditEvent(
  action: string,
  entityId?: string,
): Promise<{ id: string; action: string; entityId: string | null } | null> {
  if (entityId) {
    const result = await getPool().query<{
      id: string;
      action: string;
      entityId: string | null;
    }>(
      `
        SELECT id, action, "entityId"
        FROM "AuditEvent"
        WHERE action = $1 AND "entityId" = $2
        ORDER BY "createdAt" DESC
        LIMIT 1
      `,
      [action, entityId],
    );
    return result.rows[0] ?? null;
  }

  const result = await getPool().query<{
    id: string;
    action: string;
    entityId: string | null;
  }>(
    `
      SELECT id, action, "entityId"
      FROM "AuditEvent"
      WHERE action = $1
      ORDER BY "createdAt" DESC
      LIMIT 1
    `,
    [action],
  );
  return result.rows[0] ?? null;
}

export async function deleteLeaveRequestsByDescriptionContaining(
  text: string,
): Promise<void> {
  try {
    await getPool().query(
      `DELETE FROM "LeaveRequest" WHERE description LIKE $1`,
      [`%${text}%`],
    );
  } catch (error) {
    if (!(await ignoreMissingRelation(error))) {
      throw error;
    }
  }
}

export async function deactivateAllSubstitutions(): Promise<void> {
  try {
    await getPool().query(`UPDATE "Substitution" SET "isActive" = false`);
  } catch (error) {
    if (!(await ignoreMissingRelation(error))) {
      throw error;
    }
  }
}

async function deactivateSubstitutionsOnConnection(
  connectionString: string,
): Promise<void> {
  const pool = new pg.Pool({ connectionString });
  try {
    await pool.query(`UPDATE "Substitution" SET "isActive" = false`);
  } catch (error) {
    if (!(await ignoreMissingRelation(error))) {
      throw error;
    }
  } finally {
    await pool.end();
  }
}

/** Deactivate substitutions on test DB and local `.env` DB (dev server reuse). */
export async function deactivateSubstitutionsForE2E(): Promise<void> {
  await deactivateAllSubstitutions();

  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  loadTestEnv();
  const testDbUrl = process.env.DATABASE_URL;
  const parsed = dotenv.parse(fs.readFileSync(envPath));
  const appDbUrl = parsed.DATABASE_URL;

  if (appDbUrl && appDbUrl !== testDbUrl) {
    await deactivateSubstitutionsOnConnection(appDbUrl);
  }
}

export async function isLeaveSchemaAvailable(): Promise<boolean> {
  try {
    await getPool().query(`SELECT 1 FROM "LeaveRequest" LIMIT 1`);
    return true;
  } catch (error) {
    if (await ignoreMissingRelation(error)) {
      return false;
    }
    throw error;
  }
}
