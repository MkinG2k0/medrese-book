import { expect, test } from "@playwright/test";

import { AUTH_STATE } from "./helpers/auth-state";
import { clickRadioButton } from "./helpers/antd";
import {
  expectJournalUrlHasGroupId,
  getJournalGroupIdFromUrl,
  gotoJournal,
  startLessonIfNeeded,
} from "./helpers/journal";
import { TEST_USERS } from "./helpers/codes";

test.describe("Уважительный пропуск", () => {
  test.use({ storageState: AUTH_STATE.teacher1 });

  test("сохраняет и повторно загружает причину пропуска", async ({ page }) => {
    const absenceReason = "Болезнь";

    await gotoJournal(page);
    await expectJournalUrlHasGroupId(page);
    await startLessonIfNeeded(page);

    const groupId = await getJournalGroupIdFromUrl(page);
    await page.getByRole("link", { name: TEST_USERS.studentAli }).click();

    await clickRadioButton(page, "Прогул");
    const excusedCheckbox = page.getByRole("checkbox", {
      name: "Уважительная причина",
    });
    const absenceReasonField = page.getByPlaceholder(
      "Причина пропуска (необязательно)",
    );

    await excusedCheckbox.check();
    await absenceReasonField.fill(absenceReason);
    await page.getByRole("button", { name: "Сохранить урок" }).click();

    await expect(page).toHaveURL(
      new RegExp(`/journal\\?date=\\d{4}-\\d{2}-\\d{2}&groupId=${groupId}`),
    );
    await expect(page.getByText("Урок сохранён")).toBeVisible();

    await page.getByRole("link", { name: TEST_USERS.studentAli }).click();
    await expect(page.getByRole("radio", { name: "Прогул" })).toBeChecked();
    await expect(excusedCheckbox).toBeChecked();
    await expect(absenceReasonField).toHaveValue(absenceReason);
  });
});
