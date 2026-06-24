import fs from "node:fs";
import path from "node:path";

import { test as setup, expect } from "@playwright/test";

import { AUTH_DIR, AUTH_STATE } from "./helpers/auth-state";
import { TEST_CODES } from "./helpers/codes";

fs.mkdirSync(AUTH_DIR, { recursive: true });

const roles: { code: string; file: string }[] = [
  { code: TEST_CODES.superAdmin, file: AUTH_STATE.superAdmin },
  { code: TEST_CODES.manager, file: AUTH_STATE.manager },
  { code: TEST_CODES.teacher1, file: AUTH_STATE.teacher1 },
  { code: TEST_CODES.teacher2, file: AUTH_STATE.teacher2 },
  { code: TEST_CODES.studentAli, file: AUTH_STATE.studentAli },
  { code: TEST_CODES.studentUsman, file: AUTH_STATE.studentUsman },
];

for (const { code, file } of roles) {
  setup(`authenticate ${path.basename(file, ".json")}`, async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("000000").fill(code);
    await page.getByRole("button", { name: "Войти" }).click();
    await page.waitForURL((url) => !/\/login$/.test(url.pathname), {
      waitUntil: "commit",
    });
    await expect(page.getByRole("button", { name: "Выйти" })).toBeVisible();
    await page.context().storageState({ path: file });
  });
}
