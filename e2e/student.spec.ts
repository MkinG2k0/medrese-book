import { expect, test } from "@playwright/test";

import { AUTH_STATE } from "./helpers/auth-state";

test.describe("Личный кабинет ученика", () => {
  test.use({ storageState: AUTH_STATE.studentAli });

  test.beforeEach(async ({ page }) => {
    await page.goto("/student/me");
    await expect(page.getByRole("heading", { name: "Али" })).toBeVisible();
  });

  test("отображает профиль и прогресс", async ({ page }) => {
    await expect(page.getByText(/Прогресс: шаг \d+ из \d+/)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Текущий урок:/ })).toBeVisible();
  });

  test("показывает раздел наград", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Награды" })).toBeVisible();
    await expect(page.getByText("Пока нет наград")).toBeVisible();
  });

  test("показывает историю занятий", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "История занятий" })).toBeVisible();
  });

  test("не имеет доступа к журналу учителя", async ({ page }) => {
    await page.goto("/journal");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Личный кабинет ученика с историей", () => {
  test.use({ storageState: AUTH_STATE.studentUsman });

  test("ученик с пройденными шагами видит занятия в истории", async ({
    page,
  }) => {
    await page.goto("/student/me");
    await expect(page.getByRole("heading", { name: "Усман" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "История занятий" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "PRESENT" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "3" })).toBeVisible();
  });
});
