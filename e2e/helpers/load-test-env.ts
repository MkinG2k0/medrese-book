import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

/** Стандартное имя: `.env.test` (как `.env.local` / `.env.production` в Next.js). */
export const TEST_ENV_FILE = ".env.test";

export function loadTestEnv(): void {
  const envPath = path.resolve(process.cwd(), TEST_ENV_FILE);

  if (!fs.existsSync(envPath)) {
    throw new Error(
      `Файл ${TEST_ENV_FILE} не найден. Скопируйте .env.test.example → ${TEST_ENV_FILE} и заполните переменные.`,
    );
  }

  const { error } = dotenv.config({ path: envPath, override: true });
  if (error) {
    throw error;
  }
}
