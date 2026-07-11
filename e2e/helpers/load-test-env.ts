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

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}
