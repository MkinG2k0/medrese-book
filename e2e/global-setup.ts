import { execSync } from "node:child_process";
import path from "node:path";

import { loadTestEnv } from "./helpers/load-test-env";

function runSeed(cwd: string) {
  execSync("pnpm db:seed:e2e", {
    cwd,
    stdio: "inherit",
    env: process.env,
  });
}

export default async function globalSetup() {
  loadTestEnv();

  if (process.env.E2E_SKIP_SEED === "1") {
    console.log("[e2e] Пропуск seed (E2E_SKIP_SEED=1)");
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL не задан. Заполните .env.test перед запуском e2e.",
    );
  }

  const cwd = path.resolve(__dirname, "..");
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(
        `[e2e] Сброс и загрузка демо-данных (попытка ${attempt}/${maxAttempts})...`,
      );
      runSeed(cwd);
      return;
    } catch {
      if (attempt === maxAttempts) {
        throw new Error(
          "Не удалось выполнить pnpm db:seed:e2e. Проверьте DATABASE_URL в .env.test. " +
            "Для пропуска seed задайте E2E_SKIP_SEED=1.",
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}
