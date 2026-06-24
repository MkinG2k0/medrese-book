import { defineConfig, devices } from "@playwright/test";

import { loadTestEnv } from "./e2e/helpers/load-test-env";

loadTestEnv();

const testPort = process.env.PLAYWRIGHT_PORT ?? "3001";
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${testPort}`;

const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
if (!authSecret) {
  throw new Error("AUTH_SECRET не задан. Заполните AUTH_SECRET в .env.test.");
}

const webServerEnv: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(process.env).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  ),
  AUTH_SECRET: authSecret,
  AUTH_URL: baseURL,
  NEXTAUTH_URL: baseURL,
  PORT: testPort,
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "ru-RU",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "api",
      testMatch: /api-.*\.spec\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
      testIgnore: [/auth\.setup\.ts/, /api-.*\.spec\.ts/],
    },
  ],
  globalSetup: "./e2e/global-setup.ts",
  webServer: {
    command: "pnpm dev --port 3005",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 10_000,
    env: webServerEnv,
  },
});
