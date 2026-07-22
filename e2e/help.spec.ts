import { expect, test } from "@playwright/test";

import { loginAs } from "./helpers/auth";
import { TEST_CODES } from "./helpers/codes";

test.describe("Справка", () => {
  test("учитель открывает /help и видит пункт меню", async ({ page }) => {
    await loginAs(page, TEST_CODES.teacher1);
    await page.goto("/help");

    await expect(page).toHaveURL(/\/help/);
    await expect(page.getByRole("heading", { name: "Справка" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Справка" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Обзор" })).toBeVisible();
  });

  test("менеджер открывает /help", async ({ page }) => {
    await loginAs(page, TEST_CODES.manager);
    await page.goto("/help");

    await expect(page).toHaveURL(/\/help/);
    await expect(page.getByRole("heading", { name: "Справка" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Менеджер" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Учитель" })).toBeVisible();
  });

  test("ученик не остаётся на /help", async ({ page }) => {
    await loginAs(page, TEST_CODES.studentAli);
    await page.goto("/help");

    await expect(page).not.toHaveURL(/\/help/);
  });
});
