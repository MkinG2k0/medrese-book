import { expect, test } from "@playwright/test";

import { AUTH_STATE } from "./helpers/auth-state";
import { startLessonIfNeeded } from "./helpers/journal";
import { TEST_CODES, TEST_USERS } from "./helpers/codes";
import {
  getStudentIdByCode,
  setStudentStatus,
} from "./helpers/db";

test.describe("Статусы учеников в журнале", () => {
  test.use({ storageState: AUTH_STATE.teacher1 });
  test.describe.configure({ mode: "serial" });

  let usmanId: string;
  let bilalId: string;

  test.beforeAll(async () => {
    usmanId = await getStudentIdByCode(TEST_CODES.studentUsman);
    bilalId = await getStudentIdByCode(TEST_CODES.studentBilal);
  });

  test.afterEach(async () => {
    await setStudentStatus(usmanId, "ACTIVE");
    await setStudentStatus(bilalId, "ACTIVE");
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/journal");
    await expect(
      page.getByRole("heading", { name: "Журнал на сегодня" }),
    ).toBeVisible();
    await startLessonIfNeeded(page);
  });

  test("не показывает архивного ученика в журнале", async ({ page }) => {
    await setStudentStatus(bilalId, "ARCHIVE");

    await expect(
      page.getByRole("row", { name: new RegExp(TEST_USERS.studentBilal) }),
    ).toHaveCount(0);
  });

  test("ученик на паузе — модалка подтверждения перед уроком", async ({
    page,
  }) => {
    await setStudentStatus(usmanId, "PAUSE");

    const usmanRow = page.getByRole("row", {
      name: new RegExp(TEST_USERS.studentUsman),
    });
    await expect(usmanRow).toBeVisible();
    await usmanRow.click();

    const dialog = page.getByRole("dialog", {
      name: "Вывести ученика из паузы?",
    });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Нет" }).click();
    await expect(page).toHaveURL(/\/journal$/);

    await usmanRow.click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Да", exact: true }).click();

    await expect(page).toHaveURL(new RegExp(`/journal/${usmanId}`));
    await expect(
      page.getByRole("heading", { name: new RegExp(TEST_USERS.studentUsman) }),
    ).toBeVisible();
  });

  test("«Сохранить и перейти» пропускает ученика на паузе", async ({
    page,
  }) => {
    await setStudentStatus(usmanId, "PAUSE");

    await page.getByRole("link", { name: TEST_USERS.studentAli }).click();
    await page.getByRole("button", {
      name: new RegExp(`Сохранить и перейти к ${TEST_USERS.studentBilal}`),
    }).click();

    await expect(
      page.getByRole("heading", { name: new RegExp(TEST_USERS.studentBilal) }),
    ).toBeVisible();
  });
});
