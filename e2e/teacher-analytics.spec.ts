import { expect, test } from "@playwright/test";

import { AUTH_STATE } from "./helpers/auth-state";
import { TEST_USERS } from "./helpers/codes";

test.describe("Аналитика учителей — менеджер", () => {
  test.use({ storageState: AUTH_STATE.manager });

  test("видит страницу аналитики учителей", async ({ page }) => {
    await page.goto("/analytics/teachers");
    await expect(
      page.getByRole("heading", { name: "Аналитика учителей" }),
    ).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Учитель" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Пришел" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Ушел" })).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Длительность всех уроков" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Длительность на раб. месте" }),
    ).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "За день" })).toBeVisible();
    await page.getByRole("button", { name: "Развернуть строку" }).first().click();
    await expect(page.getByRole("columnheader", { name: "Предмет" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Группа" })).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Начало урока" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Конец урока" }),
    ).toBeVisible();
    await expect(page.locator(".ant-picker").first()).toBeVisible();
  });

  test("открывает модалку ставки по клику на учителя", async ({ page }) => {
    await page.goto("/analytics/teachers");
    await page.getByRole("button", { name: TEST_USERS.teacher1Name }).click();

    const dialog = page.getByRole("dialog", {
      name: `Ставка — ${TEST_USERS.teacher1Name}`,
    });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("История ставок")).toBeVisible();
    await expect(dialog.getByRole("columnheader", { name: "Дата" })).toBeVisible();
    await expect(
      dialog.getByRole("columnheader", { name: "Ставка" }),
    ).toBeVisible();

    await dialog.getByRole("textbox", { name: "Почасовая ставка" }).fill("1875");
    await dialog.getByRole("button", { name: "Сохранить ставку" }).click();
    await expect(page.getByText("Ставка сохранена")).toBeVisible();
    await expect(dialog.getByText("текущая")).toBeVisible();
    await expect(dialog.getByText(/875/)).toBeVisible();
  });
});

test.describe("Аналитика учителей — учитель", () => {
  test.use({ storageState: AUTH_STATE.teacher1 });

  test("не имеет доступа к аналитике учителей", async ({ page }) => {
    await page.goto("/analytics/teachers");
    await expect(page).not.toHaveURL(/\/analytics\/teachers$/);
  });

  test("видит объединённую страницу зарплаты и часов", async ({ page }) => {
    await page.goto("/accounting/my-salary");
    await expect(page).toHaveURL(/\/accounting\/my-salary/);
    await expect(
      page.getByRole("heading", { name: "Моя зарплата" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Мои часы" }),
    ).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Пришел" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Ушел" })).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Длительность всех уроков" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Длительность на раб. месте" }),
    ).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "За день" })).toBeVisible();
    await expect(page.getByText("Всего за день:")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Ставка" })).toBeVisible();
    await expect(page.getByText("История ставок")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Предмет" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Группа" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "За урок" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Развернуть строку" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("columnheader", { name: "Учитель" }),
    ).not.toBeVisible();
  });

  test("старый URL /analytics/my-hours перенаправляет на /accounting/my-salary", async ({
    page,
  }) => {
    await page.goto("/analytics/my-hours");
    await expect(page).toHaveURL(/\/accounting\/my-salary/);
    await expect(
      page.getByRole("heading", { name: "Моя зарплата" }),
    ).toBeVisible();
  });
});
