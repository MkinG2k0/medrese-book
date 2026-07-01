import "dotenv/config";

import { endOfMonth, startOfMonth } from "date-fns";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

import { PrismaClient } from "../src/shared/lib/db";
import {
  getCalendarDayQueryRange,
  getLocalDateString,
} from "../src/shared/lib/calendar-date";
import {
  analyticsCompletionFilter,
  analyticsSessionFilter,
} from "../src/shared/lib/analytics-queries/filters";

const ITERATIONS = Number(process.env.BENCH_ITERATIONS ?? 10);
const WARMUP = Number(process.env.BENCH_WARMUP ?? 3);
const CONNECT_TIMEOUT_MS = Number(process.env.BENCH_CONNECT_TIMEOUT_MS ?? 30_000);

const connectionString = normalizeConnectionString(process.env.DATABASE_URL);
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pgPool = new pg.Pool({
  connectionString,
  max: 5,
  connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pgPool),
});

type BenchContext = {
  groupId: string;
  groupName: string;
  studentId: string;
  dayRange: { start: Date; end: Date };
  monthFrom: Date;
  monthTo: Date;
};

function normalizeConnectionString(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("uselibpqcompat")) {
      parsed.searchParams.set("uselibpqcompat", "true");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

async function withTimeout<T>(
  label: string,
  fn: () => Promise<T>,
  timeoutMs = CONNECT_TIMEOUT_MS,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(
            new Error(
              `${label}: таймаут ${timeoutMs} ms — проверьте DATABASE_URL и доступность БД`,
            ),
          );
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

type BenchResult = {
  name: string;
  description: string;
  runs: number[];
  avg: number;
  min: number;
  max: number;
  p95: number;
};

function percentile(sorted: number[], p: number): number {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)]!;
}

async function measure(
  name: string,
  description: string,
  fn: () => Promise<unknown>,
  iterations = ITERATIONS,
): Promise<BenchResult> {
  for (let i = 0; i < WARMUP; i++) {
    await fn();
  }

  const runs: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    runs.push(performance.now() - start);
  }

  const sorted = [...runs].sort((a, b) => a - b);
  const avg = runs.reduce((sum, ms) => sum + ms, 0) / runs.length;

  return {
    name,
    description,
    runs,
    avg,
    min: sorted[0]!,
    max: sorted[sorted.length - 1]!,
    p95: percentile(sorted, 95),
  };
}

function maskDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = "***";
    return parsed.toString();
  } catch {
    return url.replace(/:([^:@]+)@/, ":***@");
  }
}

function formatMs(ms: number): string {
  if (ms < 1) return `${ms.toFixed(2)} ms`;
  if (ms < 1000) return `${ms.toFixed(1)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function printResults(results: BenchResult[]) {
  const nameWidth = Math.max(...results.map((r) => r.name.length), 4);
  const descWidth = Math.max(...results.map((r) => r.description.length), 11);

  console.log("");
  console.log(
    `${"Тест".padEnd(nameWidth)}  ${"Описание".padEnd(descWidth)}  ${"avg".padStart(10)}  ${"min".padStart(10)}  ${"p95".padStart(10)}  ${"max".padStart(10)}`,
  );
  console.log("-".repeat(nameWidth + descWidth + 48));

  for (const r of results) {
    console.log(
      `${r.name.padEnd(nameWidth)}  ${r.description.padEnd(descWidth)}  ${formatMs(r.avg).padStart(10)}  ${formatMs(r.min).padStart(10)}  ${formatMs(r.p95).padStart(10)}  ${formatMs(r.max).padStart(10)}`,
    );
  }
}

async function loadSampleIds() {
  const [group, student] = await Promise.all([
    prisma.group.findFirst({ select: { id: true, name: true } }),
    prisma.student.findFirst({ select: { id: true } }),
  ]);

  if (!group || !student) {
    throw new Error(
      "В базе нет данных для бенчмарка. Запустите: pnpm db:seed",
    );
  }

  return { groupId: group.id, groupName: group.name, studentId: student.id };
}

async function printTableCounts() {
  const [users, students, sessions, completions, steps] = await Promise.all([
    prisma.user.count(),
    prisma.student.count(),
    prisma.session.count(),
    prisma.stepCompletion.count(),
    prisma.step.count(),
  ]);

  console.log("Объём данных:");
  console.log(`  users: ${users}, students: ${students}, sessions: ${sessions}`);
  console.log(`  step_completions: ${completions}, steps: ${steps}`);
}

async function measureOnce(
  name: string,
  description: string,
  fn: () => Promise<unknown>,
): Promise<BenchResult> {
  const start = performance.now();
  await fn();
  const ms = performance.now() - start;
  return { name, description, runs: [ms], avg: ms, min: ms, max: ms, p95: ms };
}

async function main() {
  console.log("=== Бенчмарк базы данных ===");
  console.log(`URL: ${maskDatabaseUrl(connectionString)}`);
  console.log(`Итераций: ${ITERATIONS}, прогрев: ${WARMUP}`);
  console.log(`Таймаут подключения: ${CONNECT_TIMEOUT_MS} ms`);
  console.log("Подключение к БД...");

  const { groupId, groupName, studentId } = await withTimeout(
    "Подключение",
    () => loadSampleIds(),
  );

  const ctx: BenchContext = {
    groupId,
    groupName,
    studentId,
    dayRange: getCalendarDayQueryRange(getLocalDateString(new Date())),
    monthFrom: startOfMonth(new Date()),
    monthTo: endOfMonth(new Date()),
  };

  await printTableCounts();
  console.log(
    `\nТестовые сущности: группа «${ctx.groupName}», studentId=${ctx.studentId}`,
  );

  const results: BenchResult[] = [];
  const connectionResults: BenchResult[] = [];

  results.push(
    await measure("ping", "SELECT 1 (Prisma)", () =>
      prisma.$queryRaw`SELECT 1`,
    ),
  );

  const pgBenchPool = new pg.Pool({
    connectionString,
    max: 2,
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
  });
  try {
    results.push(
      await measure("pg_query", "SELECT 1 (pg pool)", () =>
        pgBenchPool.query("SELECT 1"),
      ),
    );
  } finally {
    await pgBenchPool.end();
  }

  connectionResults.push(
    await measureOnce("pg_connect", "Новое TCP+SSL подключение", async () => {
      const client = new pg.Client({
        connectionString,
        connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
      });
      await client.connect();
      await client.end();
    }),
  );

  results.push(
    await measure("counts", "COUNT по 5 таблицам", () =>
      Promise.all([
        prisma.user.count(),
        prisma.student.count(),
        prisma.session.count(),
        prisma.stepCompletion.count(),
        prisma.step.count(),
      ]),
    ),
  );

  results.push(
    await measure("journal", "Список учеников группы", () =>
      prisma.group.findUnique({
        where: { id: ctx.groupId },
        include: {
          students: {
            include: {
              user: true,
              level: true,
              sessions: {
                where: {
                  date: { gte: ctx.dayRange.start, lte: ctx.dayRange.end },
                },
                orderBy: { date: "desc" },
                include: { completions: true },
              },
            },
          },
        },
      }),
    ),
  );

  results.push(
    await measure("lesson", "Страница урока (getStudentLesson)", () =>
      prisma.student.findUnique({
        where: { id: ctx.studentId },
        include: {
          user: true,
          group: {
            include: {
              students: {
                include: { user: { select: { name: true } } },
              },
            },
          },
          level: {
            include: {
              steps: {
                select: {
                  id: true,
                  order: true,
                  title: true,
                  description: true,
                  hours: true,
                },
                orderBy: { order: "asc" },
              },
            },
          },
          completions: {
            where: {
              step: { level: { students: { some: { id: ctx.studentId } } } },
            },
            select: { stepId: true, grade: true, note: true },
            orderBy: { createdAt: "asc" },
          },
          sessions: {
            where: {
              date: { gte: ctx.dayRange.start, lte: ctx.dayRange.end },
            },
            select: {
              id: true,
              studentId: true,
              date: true,
              attendance: true,
              lateMinutes: true,
              note: true,
              completions: {
                select: { stepId: true, grade: true, note: true },
              },
            },
            orderBy: { date: "desc" },
          },
        },
      }),
    ),
  );

  results.push(
    await measure("completions", "Оценки ученика", () =>
      prisma.stepCompletion.findMany({
        where: { studentId: ctx.studentId },
        include: { step: { select: { title: true, order: true } } },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    ),
  );

  results.push(
    await measure("analytics", "Топ учеников за месяц", () =>
      prisma.student.findMany({
        include: {
          user: true,
          completions: {
            where: analyticsCompletionFilter({
              gte: ctx.monthFrom,
              lte: ctx.monthTo,
            }),
          },
          sessions: {
            where: analyticsSessionFilter({
              gte: ctx.monthFrom,
              lte: ctx.monthTo,
            }),
          },
        },
      }),
    ),
  );

  results.push(
    await measure("write_tx", "Транзакция upsert сессии", async () => {
      const existing = await prisma.session.findFirst({
        where: { studentId: ctx.studentId },
        select: { id: true },
      });

      await prisma.$transaction(async (tx) => {
        if (existing) {
          await tx.session.update({
            where: { id: existing.id },
            data: { note: `bench-${Date.now()}` },
          });
        }
      });
    }),
  );

  printResults(results);

  if (connectionResults.length > 0) {
    console.log("\n--- Накладные расходы подключения (1 прогон) ---");
    printResults(connectionResults);
  }

  const slowest = [...results].sort((a, b) => b.p95 - a.p95)[0]!;
  console.log(`\nСамый медленный (p95): ${slowest.name} — ${formatMs(slowest.p95)}`);

  if (slowest.p95 > 500) {
    console.log(
      "⚠ p95 > 500 ms — проверьте сеть до БД, индексы и объём данных.",
    );
  } else if (slowest.p95 > 200) {
    console.log("ℹ p95 > 200 ms — приемлемо для удалённой БД, но есть запас.");
  } else {
    console.log("✓ Все запросы укладываются в < 200 ms (p95).");
  }
}

main()
  .catch((err) => {
    console.error("Ошибка бенчмарка:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pgPool.end();
  });
