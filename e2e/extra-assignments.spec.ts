import { expect, test } from "@playwright/test";

import { clickRadioButton } from "./helpers/antd";
import { AUTH_STATE } from "./helpers/auth-state";
import { TEST_USERS } from "./helpers/codes";
import { startLessonIfNeeded } from "./helpers/journal";

test.describe("Доп. задания", () => {
  test.describe.configure({ mode: "serial" });

  const uniqueTitle = `E2E Extra ${Date.now()}`;

  test("учитель видит пункт меню «Доп. задания»", async ({ browser }) => {
    const context = await browser.newContext({
      storageState: AUTH_STATE.teacher1,
    });
    const page = await context.newPage();
    await page.goto("/journal");
    await expect(page.getByRole("menuitem", { name: "Доп. задания" })).toBeVisible();
    await context.close();
  });

  test("STUDENT не видит страницу справочника", async ({ browser }) => {
    const context = await browser.newContext({
      storageState: AUTH_STATE.studentAli,
    });
    const page = await context.newPage();
    await page.goto("/extra-assignments");
    await expect(page).not.toHaveURL(/\/extra-assignments/);
    await context.close();
  });

  test.describe("сценарий учителя", () => {
    test.use({ storageState: AUTH_STATE.teacher1 });

    test("создаёт задание в справочнике", async ({ page }) => {
      await page.goto("/extra-assignments");
      await expect(
        page.getByRole("heading", { name: "Доп. задания" }),
      ).toBeVisible();
      await expect(page.getByLabel("Предмет")).toBeVisible();

      const stepSelect = page.locator(".ant-select").filter({
        has: page.locator(".ant-select-selection-placeholder", {
          hasText: "Шаг",
        }),
      });
      await stepSelect.click();
      const quranStepCount = await page.locator(".ant-select-item-option").count();
      await page.keyboard.press("Escape");

      await page.getByLabel("Предмет").click();
      await page.getByTitle("Таджвид", { exact: true }).click();
      await expect(stepSelect).toBeVisible();

      await stepSelect.click();
      const tajweedStepCount = await page.locator(".ant-select-item-option").count();
      await page.keyboard.press("Escape");
      expect(tajweedStepCount).toBeLessThan(quranStepCount);

      await page.getByRole("button", { name: "Создать задание" }).click();
      const dialog = page.getByRole("dialog", { name: "Создать задание" });
      await expect(dialog).toBeVisible();

      await dialog.getByRole("textbox").first().fill(uniqueTitle);
      await dialog.getByRole("button", { name: "Сохранить" }).click();

      await expect(
        page.getByRole("cell", { name: uniqueTitle, exact: true }),
      ).toBeVisible();
    });

    test("не видит кнопку удаления у чужого задания", async ({ page }) => {
      await page.goto("/extra-assignments");
      const systemRow = page.getByRole("row", {
        name: /E2E Extra: Повторение суры Аль-Фатиха/,
      });
      await expect(systemRow.getByRole("button", { name: "Удалить" })).toHaveCount(
        0,
      );
    });

    test("назначает и оценивает на уроке", async ({ page }) => {
      await page.goto("/journal");
      await startLessonIfNeeded(page);
      await page.getByRole("link", { name: TEST_USERS.studentAli }).click();

      const stepCard = page
        .locator(".ant-card")
        .filter({ hasText: /^Шаг \d+/ })
        .first();
      await stepCard.click();

      await stepCard
        .getByRole("button", { name: "Дать доп. задание" })
        .click();

      const assignDialog = page.getByRole("dialog", { name: "Дать доп. задание" });
      await expect(assignDialog).toBeVisible();

      const targetRow = assignDialog.getByRole("row", { name: uniqueTitle });
      await targetRow.getByRole("button", { name: "Назначить" }).click();

      await expect(stepCard.getByText(uniqueTitle)).toBeVisible();

      await clickRadioButton(stepCard, "Хорошо");
      await expect(stepCard.getByRole("radio", { name: "Хорошо" })).toBeChecked();
    });
  });
});
