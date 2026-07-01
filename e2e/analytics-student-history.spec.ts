import { expect, test } from "@playwright/test";

import { AUTH_STATE } from "./helpers/auth-state";
import { TEST_USERS } from "./helpers/codes";

test.describe("Аналитика — история учёбы ученика", () => {
  test.use({ storageState: AUTH_STATE.teacher1 });

  test("клик по ученику открывает модалку с историей", async ({ page }) => {
    await page.goto("/analytics");
    await expect(page.getByRole("heading", { name: "Аналитика" })).toBeVisible();

    const studentRow = page
      .getByRole("row")
      .filter({
        has: page.getByRole("cell", {
          name: TEST_USERS.studentAli,
          exact: true,
        }),
      })
      .first();
    await expect(studentRow).toBeVisible();
    await studentRow.click();

    const dialog = page.getByRole("dialog", {
      name: new RegExp(`История учёбы — ${TEST_USERS.studentAli}`),
    });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("columnheader", { name: "Шаг" })).toBeVisible();
    await expect(
      dialog.getByRole("columnheader", { name: "Оценка" }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("columnheader", { name: "Дата занятия" }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("columnheader", { name: "Посещаемость" }),
    ).toBeVisible();
    await expect(dialog.locator(".ant-pagination")).toBeVisible();
  });

  test("таблица топа учеников показывает количество посещений за период", async ({
    page,
  }) => {
    await page.goto("/analytics");
    await expect(
      page.getByRole("columnheader", { name: "Посещено" }),
    ).toBeVisible();
  });
});
