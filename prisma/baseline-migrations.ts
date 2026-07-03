import "dotenv/config";

import { readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "migrations");

const migrationNames = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

if (migrationNames.length === 0) {
  throw new Error("Миграции не найдены в prisma/migrations");
}

console.log(
  `Baseline: пометить ${migrationNames.length} миграций как уже применённые (данные не трогаются)`,
);
console.log(`DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:[^:@/]+@/, ":***@") ?? "не задан"}`);
console.log("");

for (const name of migrationNames) {
  console.log(`→ resolve --applied ${name}`);
  execSync(`pnpm exec prisma migrate resolve --applied ${name}`, {
    stdio: "inherit",
  });
}

console.log("");
console.log("Готово. Проверка:");
execSync("pnpm exec prisma migrate status", { stdio: "inherit" });
