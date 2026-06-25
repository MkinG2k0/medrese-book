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

export type NotificationRow = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  readAt: Date | null;
  createdAt: Date;
};

export async function getUserIdByCode(code: string): Promise<string> {
  const result = await getPool().query<{ id: string }>(
    `SELECT id FROM "User" WHERE code = $1 LIMIT 1`,
    [code],
  );
  const user = result.rows[0];
  if (!user) {
    throw new Error(`User not found for code: ${code}`);
  }
  return user.id;
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const result = await getPool().query<{ count: string }>(
    `
      SELECT COUNT(*)::text AS count
      FROM "Notification"
      WHERE "userId" = $1 AND "readAt" IS NULL
    `,
    [userId],
  );
  return Number(result.rows[0]?.count ?? 0);
}

export async function getLatestNotification(
  userId: string,
): Promise<NotificationRow | null> {
  const result = await getPool().query<NotificationRow>(
    `
      SELECT id, "userId", type, title, body, link, "readAt", "createdAt"
      FROM "Notification"
      WHERE "userId" = $1
      ORDER BY "createdAt" DESC
      LIMIT 1
    `,
    [userId],
  );
  return result.rows[0] ?? null;
}

export async function waitForUnreadCount(
  userId: string,
  minCount: number,
  timeoutMs = 10_000,
): Promise<number> {
  if (!(await isNotificationSchemaAvailable())) {
    return 0;
  }

  const startedAt = Date.now();
  let count = await countUnreadNotifications(userId);

  while (count < minCount && Date.now() - startedAt < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    count = await countUnreadNotifications(userId);
  }

  return count;
}

async function ignoreMissingRelation(error: unknown): Promise<boolean> {
  return (
    error instanceof Error &&
    (error.message.includes("does not exist") ||
      error.message.includes("Connection terminated"))
  );
}

export async function isNotificationSchemaAvailable(): Promise<boolean> {
  try {
    await getPool().query(`SELECT 1 FROM "Notification" LIMIT 1`);
    return true;
  } catch (error) {
    if (await ignoreMissingRelation(error)) {
      return false;
    }
    throw error;
  }
}
