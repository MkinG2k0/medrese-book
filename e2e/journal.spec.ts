import { expect, test } from "@playwright/test";

import { AUTH_STATE } from "./helpers/auth-state";
import { clickRadioButton } from "./helpers/antd";
import {
  E2E_GROUP_AL_FATIHA,
  E2E_GROUP_AL_IKHLAS,
  expectJournalUrlHasGroupId,
  getJournalGroupIdFromUrl,
  gotoJournal,
  startLessonIfNeeded,
} from "./helpers/journal";
import { TEST_USERS } from "./helpers/codes";

test.describe("Журнал учителя", () => {
  test.use({ storageState: AUTH_STATE.teacher1 });
  test.describe.configure({ mode: "serial" });

  test.describe("до начала урока", () => {
    test.beforeEach(async ({ page }) => {
      await gotoJournal(page);
      await expectJournalUrlHasGroupId(page);
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
      await gotoJournal(page);
      await expectJournalUrlHasGroupId(page);
      await expect(
        page.getByRole("heading", { name: "Журнал на сегодня" }),
      ).toBeVisible();
      await startLessonIfNeeded(page);
    });

    test("смена группы в Select меняет список учеников", async ({ page }) => {
      await expect(
        page.getByRole("link", { name: TEST_USERS.studentAli }),
      ).toBeVisible();

      const groupSelect = page.locator(".ant-select").first();
      await groupSelect.click();
      await page.getByTitle(E2E_GROUP_AL_IKHLAS).click();

      const nextGroupId = await getJournalGroupIdFromUrl(page);
      expect(nextGroupId).toBeTruthy();
      await expect(
        page.getByRole("link", { name: TEST_USERS.studentKhalid }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: TEST_USERS.studentAli }),
      ).not.toBeVisible();

      await groupSelect.click();
      await page.getByTitle(E2E_GROUP_AL_FATIHA).click();
      await expect(
        page.getByRole("link", { name: TEST_USERS.studentAli }),
      ).toBeVisible();
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
      const groupId = await getJournalGroupIdFromUrl(page);
      await page.getByRole("link", { name: TEST_USERS.studentAli }).click();
      await expect(page).toHaveURL(/\/journal\/.+/);
      await expect(page).toHaveURL(new RegExp(`groupId=${groupId}`));
      await expect(
        page.getByRole("heading", { name: new RegExp(TEST_USERS.studentAli) }),
      ).toBeVisible();
      await expect(page.getByText("Посещаемость")).toBeVisible();
    });

    test("сохраняет урок с оценкой и возвращает в журнал", async ({ page }) => {
      const groupId = await getJournalGroupIdFromUrl(page);
      await page.getByRole("link", { name: TEST_USERS.studentAli }).click();
      await expect(page.getByRole("radio", { name: "Пришёл" })).toBeChecked();
      await clickRadioButton(page, "Хорошо");
      await page.getByRole("button", { name: "Сохранить урок" }).click();

      await expect(page).toHaveURL(
        new RegExp(`/journal\\?date=\\d{4}-\\d{2}-\\d{2}&groupId=${groupId}`),
      );
      await expect(page.getByText("Урок сохранён")).toBeVisible();

      const aliRow = page.getByRole("row", {
        name: new RegExp(TEST_USERS.studentAli),
      });
      await expect(aliRow.getByText("Пришёл")).toBeVisible();
      await expect(aliRow.getByText("3")).toBeVisible();
    });

    test("сохраняет опоздание с минутами", async ({ page }) => {
      const groupId = await getJournalGroupIdFromUrl(page);
      await page.getByRole("link", { name: TEST_USERS.studentBilal }).click();
      await clickRadioButton(page, "Опоздал");
      await page.locator(".ant-input-number-input").fill("15");
      await clickRadioButton(page, "Хорошо");
      await page.getByRole("button", { name: "Сохранить урок" }).click();

      await expect(page).toHaveURL(
        new RegExp(`/journal\\?date=\\d{4}-\\d{2}-\\d{2}&groupId=${groupId}`),
      );
      const bilalRow = page.getByRole("row", {
        name: new RegExp(TEST_USERS.studentBilal),
      });
      await expect(bilalRow.getByText("Опоздал")).toBeVisible();
    });

    test("сохраняет урок без оценок — только посещаемость", async ({
      page,
    }) => {
      const groupSelect = page.locator(".ant-select").first();
      await groupSelect.click();
      await page.getByTitle(E2E_GROUP_AL_IKHLAS).click();

      await page.getByRole("link", { name: TEST_USERS.studentKhalid }).click();
      await expect(page.getByRole("radio", { name: "Пришёл" })).toBeChecked();
      await page.getByRole("button", { name: "Сохранить урок" }).click();

      await expect(page).toHaveURL(/groupId=/);
      await expect(page.getByText("Урок сохранён")).toBeVisible();

      const khalidRow = page.getByRole("row", {
        name: new RegExp(TEST_USERS.studentKhalid),
      });
      await expect(khalidRow.getByText("Пришёл")).toBeVisible();
      await expect(khalidRow.getByText("—").first()).toBeVisible();
    });

    test("сохраняет урок Khalid во второй группе учителя", async ({ page }) => {
      const groupSelect = page.locator(".ant-select").first();
      await groupSelect.click();
      await page.getByTitle(E2E_GROUP_AL_IKHLAS).click();
      await expect(
        page.getByRole("link", { name: TEST_USERS.studentKhalid }),
      ).toBeVisible();

      const groupId = await getJournalGroupIdFromUrl(page);
      await page.getByRole("link", { name: TEST_USERS.studentKhalid }).click();
      await page.getByRole("button", { name: "Сохранить урок" }).click();

      await expect(page).toHaveURL(
        new RegExp(`/journal\\?date=\\d{4}-\\d{2}-\\d{2}&groupId=${groupId}`),
      );
    });

    test("отжимает выбранную оценку повторным кликом", async ({ page }) => {
      const groupSelect = page.locator(".ant-select").first();
      await groupSelect.click();
      await page.getByTitle(E2E_GROUP_AL_IKHLAS).click();

      await page.getByRole("link", { name: TEST_USERS.studentZayd }).click();
      await clickRadioButton(page, "Средне");
      await expect(page.getByText("пройден").first()).toBeVisible();
      await clickRadioButton(page, "Средне");
      await expect(page.getByText("пройден")).toHaveCount(0);
    });

    test("считает «Средне» пройденным шагом", async ({ page }) => {
      const groupSelect = page.locator(".ant-select").first();
      await groupSelect.click();
      await page.getByTitle(E2E_GROUP_AL_IKHLAS).click();

      await page.getByRole("link", { name: TEST_USERS.studentZayd }).click();
      await clickRadioButton(page, "Средне");
      await page.getByRole("button", { name: "Сохранить урок" }).click();

      await expect(page).toHaveURL(/groupId=/);
      const zaydRow = page.getByRole("row", {
        name: new RegExp(TEST_USERS.studentZayd),
      });
      await expect(zaydRow.getByText("1")).toBeVisible();
      await expect(zaydRow.getByRole("cell", { name: "1", exact: true })).toBeVisible();
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
      await expect(page).toHaveURL(/groupId=/);
      await expect(
        page.getByRole("heading", {
          name: new RegExp(TEST_USERS.studentBilal),
        }),
      ).toBeVisible();
    });
  });
});
