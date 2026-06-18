import { expect, test } from "@playwright/test";

import { loginAs } from "./helpers/auth";
import { TEST_CODES } from "./helpers/codes";

test.describe("Личный кабинет ученика", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_CODES.studentAli);
    await expect(page).toHaveURL(/\/student\/me/);
  });

  test("отображает профиль и прогресс", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Али" })).toBeVisible();
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
  test("ученик с пройденными шагами видит занятия в истории", async ({
    page,
  }) => {
    await loginAs(page, TEST_CODES.studentUsman);
    await expect(page).toHaveURL(/\/student\/me/);
    await expect(page.getByRole("heading", { name: "Усман" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "История занятий" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "PRESENT" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "3" })).toBeVisible();
  });
});
