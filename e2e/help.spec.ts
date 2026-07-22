import { expect, test } from "@playwright/test";

import { loginAs } from "./helpers/auth";
import { TEST_CODES } from "./helpers/codes";

test.describe("Справка", () => {
  test("учитель открывает /help и вкладки фич", async ({ page }) => {
    await loginAs(page, TEST_CODES.teacher1);
    await page.goto("/help");

    await expect(page).toHaveURL(/\/help/);
    await expect(page.getByRole("heading", { name: "Справка" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Справка" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Обзор" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Журнал" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Важно знать" })).toBeVisible();

    await page.getByRole("tab", { name: "Важно знать" }).click();
    await expect(page.getByText("Автовыход через 1 час").first()).toBeVisible();

    await page.getByRole("tab", { name: "Моя зарплата" }).click();
    await expect(
      page.getByRole("heading", { name: "Что здесь написано" }),
    ).toBeVisible();
    await expect(page.getByText("Пришел", { exact: true }).first()).toBeVisible();
  });

  test("менеджер открывает /help с ролевыми вкладками", async ({ page }) => {
    await loginAs(page, TEST_CODES.manager);
    await page.goto("/help");

    await expect(page).toHaveURL(/\/help/);
    await expect(page.getByRole("heading", { name: "Справка" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Справка менеджера" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Справка учителя" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Группы" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Важно знать" })).toBeVisible();
    await page.getByRole("tab", { name: "Важно знать" }).click();
    await expect(page.getByText("Автовыход через час").first()).toBeVisible();
  });

  test("ученик не остаётся на /help", async ({ page }) => {
    await loginAs(page, TEST_CODES.studentAli);
    await page.goto("/help");

    await expect(page).not.toHaveURL(/\/help/);
  });
});
