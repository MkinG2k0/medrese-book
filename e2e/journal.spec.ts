import { expect, test } from "@playwright/test";

import { AUTH_STATE } from "./helpers/auth-state";
import { clickRadioButton } from "./helpers/antd";
import { startLessonIfNeeded } from "./helpers/journal";
import { TEST_USERS } from "./helpers/codes";

test.describe("Журнал учителя", () => {
  test.use({ storageState: AUTH_STATE.teacher1 });
  test.describe.configure({ mode: "serial" });

  test.describe("до начала урока", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/journal");
      await expect(
        page.getByRole("heading", { name: "Журнал на сегодня" }),
      ).toBeVisible();
    });

    test("блокирует таблицу учеников до начала урока", async ({ page }) => {
      const startButton = page.getByRole("button", { name: "Начать урок" });
      if (!(await startButton.isVisible())) {
        test.skip(true, "Урок уже начат в этой среде — пропуск");
      }

      await expect(
        page.getByText(
          "Сначала нажмите «Начать урок», чтобы открыть список учеников",
        ),
      ).toBeVisible();
      await startButton.click();
      await expect(page.getByText("Урок идёт")).toBeVisible();
      await expect(
        page.getByRole("link", { name: TEST_USERS.studentAli }),
      ).toBeVisible();
    });
  });

  test.describe("с активным уроком", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/journal");
      await expect(
        page.getByRole("heading", { name: "Журнал на сегодня" }),
      ).toBeVisible();
      await startLessonIfNeeded(page);
    });

    test("отображает учеников группы Аль-Фатиха", async ({ page }) => {
      await expect(
        page.getByRole("link", { name: TEST_USERS.studentAli }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: TEST_USERS.studentUsman }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: TEST_USERS.studentBilal }),
      ).toBeVisible();
    });

    test("показывает посещаемость из seed для ученика с занятием", async ({
      page,
    }) => {
      const usmanRow = page.getByRole("row", {
        name: new RegExp(TEST_USERS.studentUsman),
      });
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

      const aliRow = page.getByRole("row", {
        name: new RegExp(TEST_USERS.studentAli),
      });
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
      const bilalRow = page.getByRole("row", {
        name: new RegExp(TEST_USERS.studentBilal),
      });
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
        page.getByRole("heading", {
          name: new RegExp(TEST_USERS.studentBilal),
        }),
      ).toBeVisible();
    });
  });
});
