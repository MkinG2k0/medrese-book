import { expect, test } from "@playwright/test";

import {
  apiGetAs,
  expectForbidden,
  TEST_CODES,
} from "./helpers/api";
import { AUTH_STATE } from "./helpers/auth-state";

test.describe("Журнал действий", () => {
  test.describe("менеджер", () => {
    test.use({ storageState: AUTH_STATE.manager });

    test("видит страницу журнала и список событий", async ({ page }) => {
      await page.goto("/admin/audit-log");
      await expect(
        page.getByRole("heading", { name: "Журнал действий" }),
      ).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Дата" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Событие" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Автор" })).toBeVisible();
    });

    test("фильтрует по типу события", async ({ page }) => {
      await page.goto("/admin/audit-log");
      await expect(
        page.getByRole("heading", { name: "Журнал действий" }),
      ).toBeVisible();

      await page.getByRole("combobox", { name: "Тип события" }).click();
      await page.getByText("Вход в систему", { exact: true }).click();
      await page.getByRole("button", { name: "Применить" }).click();

      await expect(page.getByText("Вход в систему").first()).toBeVisible();
    });

    test("открывает детали события", async ({ page }) => {
      await page.goto("/admin/audit-log");
      await expect(
        page.getByRole("heading", { name: "Журнал действий" }),
      ).toBeVisible();

      const detailsButton = page.getByRole("button", { name: "Подробнее" }).first();
      await expect(detailsButton).toBeVisible();
      await detailsButton.click();

      const dialog = page.getByRole("dialog", { name: "Детали события" });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByText("Автор")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
    });
  });

  test.describe("супер-админ", () => {
    test.use({ storageState: AUTH_STATE.superAdmin });

    test("имеет доступ к журналу", async ({ page }) => {
      await page.goto("/admin/audit-log");
      await expect(
        page.getByRole("heading", { name: "Журнал действий" }),
      ).toBeVisible();
    });
  });

  test.describe("учитель", () => {
    test.use({ storageState: AUTH_STATE.teacher1 });

    test("не видит пункт меню журнала действий", async ({ page }) => {
      await page.goto("/journal");
      await expect(
        page.getByRole("menuitem", { name: "Журнал действий" }),
      ).toHaveCount(0);
    });

    test("не может открыть страницу журнала", async ({ page }) => {
      await page.goto("/admin/audit-log");
      await expect(page).not.toHaveURL(/\/admin\/audit-log/);
    });
  });

  test("API — учитель получает 403", async () => {
    const response = await apiGetAs(TEST_CODES.teacher1, "/api/audit-events");
    await expectForbidden(response);
  });
});
