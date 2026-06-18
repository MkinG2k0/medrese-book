import { expect, test } from "@playwright/test";

import { clickRadioButton } from "./helpers/antd";
import { loginAs } from "./helpers/auth";
import { TEST_CODES, TEST_USERS } from "./helpers/codes";

test.describe("Журнал учителя", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_CODES.teacher1);
    await expect(page).toHaveURL(/\/journal/);
  });

  test("отображает учеников группы Аль-Фатиха", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Журнал на сегодня" })).toBeVisible();
    await expect(page.getByRole("link", { name: TEST_USERS.studentAli })).toBeVisible();
    await expect(page.getByRole("link", { name: TEST_USERS.studentUsman })).toBeVisible();
    await expect(page.getByRole("link", { name: TEST_USERS.studentBilal })).toBeVisible();
  });

  test("показывает посещаемость из seed для ученика с занятием", async ({
    page,
  }) => {
    const usmanRow = page.getByRole("row", { name: new RegExp(TEST_USERS.studentUsman) });
    await expect(usmanRow.getByText("Пришёл")).toBeVisible();
  });

  test("открывает страницу урока по клику на ученика", async ({ page }) => {
    await page.getByRole("link", { name: TEST_USERS.studentAli }).click();
    await expect(page).toHaveURL(/\/journal\/.+/);
    await expect(
      page.getByRole("heading", { name: new RegExp(TEST_USERS.studentAli) }),
    ).toBeVisible();
    await expect(page.getByText("Посещаемость")).toBeVisible();
  });

  test("сохраняет урок с оценкой и возвращает в журнал", async ({ page }) => {
    await page.getByRole("link", { name: TEST_USERS.studentAli }).click();
    await expect(page.getByRole("radio", { name: "Пришёл" })).toBeChecked();
    await clickRadioButton(page, "Хорошо");
    await page.getByRole("button", { name: "Сохранить урок" }).click();

    await expect(page).toHaveURL(/\/journal$/);
    await expect(page.getByText("Урок сохранён")).toBeVisible();

    const aliRow = page.getByRole("row", { name: new RegExp(TEST_USERS.studentAli) });
    await expect(aliRow.getByText("Пришёл")).toBeVisible();
    await expect(aliRow.getByText("3")).toBeVisible();
  });

  test("сохраняет опоздание с минутами", async ({ page }) => {
    await page.getByRole("link", { name: TEST_USERS.studentBilal }).click();
    await clickRadioButton(page, "Опоздал");
    await page.locator(".ant-input-number-input").fill("15");
    await clickRadioButton(page, "Хорошо");
    await page.getByRole("button", { name: "Сохранить урок" }).click();

    await expect(page).toHaveURL(/\/journal$/);
    const bilalRow = page.getByRole("row", { name: new RegExp(TEST_USERS.studentBilal) });
    await expect(bilalRow.getByText("Опоздал")).toBeVisible();
  });

  test("переходит к следующему ученику через «Сохранить и перейти»", async ({
    page,
  }) => {
    await page.getByRole("link", { name: TEST_USERS.studentAli }).click();
    await clickRadioButton(page, "Хорошо");
    const saveAndNext = page.getByRole("button", {
      name: new RegExp(`Сохранить и перейти к ${TEST_USERS.studentBilal}`),
    });
    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/sessions") &&
          response.request().method() === "POST" &&
          response.ok(),
      ),
      saveAndNext.click(),
    ]);
    await expect(
      page.getByRole("heading", { name: new RegExp(TEST_USERS.studentBilal) }),
    ).toBeVisible();
  });
});
