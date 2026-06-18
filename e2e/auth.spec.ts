import { expect, test } from "@playwright/test";

import { loginAs } from "./helpers/auth";
import { TEST_CODES } from "./helpers/codes";

test.describe("Авторизация", () => {
  test("успешный вход учителя перенаправляет в журнал", async ({ page }) => {
    await loginAs(page, TEST_CODES.teacher1);
    await expect(page).toHaveURL(/\/journal/);
    await expect(page.getByRole("heading", { name: "Журнал на сегодня" })).toBeVisible();
    await expect(page.getByRole("banner").getByText("Учитель Ахмад")).toBeVisible();
  });

  test("успешный вход ученика перенаправляет в личный кабинет", async ({ page }) => {
    await loginAs(page, TEST_CODES.studentAli);
    await expect(page).toHaveURL(/\/student\/me/);
    await expect(page.getByRole("heading", { name: "Али" })).toBeVisible();
  });

  test("успешный вход менеджера перенаправляет в админку пользователей", async ({
    page,
  }) => {
    await loginAs(page, TEST_CODES.manager);
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByRole("heading", { name: "Пользователи" })).toBeVisible();
  });

  test("неверный код показывает ошибку", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("000000").fill("999999");
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page.getByText("Неверный код доступа")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("неавторизованный пользователь перенаправляется на вход", async ({
    page,
  }) => {
    await page.goto("/journal");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Вход в дневник" })).toBeVisible();
  });

  test("выход возвращает на страницу входа", async ({ page }) => {
    await loginAs(page, TEST_CODES.teacher1);
    await page.getByRole("button", { name: "Выйти" }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
