import { expect, test } from "@playwright/test";

import { AUTH_STATE } from "./helpers/auth-state";
import { TEST_USERS } from "./helpers/codes";

test.describe("Кабинет опекуна", () => {
  test.use({ storageState: AUTH_STATE.parentAliUsman });

  test("показывает нескольких детей одного опекуна", async ({ page }) => {
    await page.goto("/parent/me");

    await expect(page.getByRole("heading", { name: "Мои дети" })).toBeVisible();
    await expect(page.getByText(TEST_USERS.parentAliUsman)).toBeVisible();
    await expect(page.getByRole("heading", { name: TEST_USERS.studentAli })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: TEST_USERS.studentUsman }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: TEST_USERS.studentBilal }),
    ).toHaveCount(0);
  });
});
