import { expect, test } from "@playwright/test";

import { TEST_CODES } from "./helpers/api";
import { loginAs } from "./helpers/auth";
import {
  countAuditEvents,
  getStudentIdByCode,
} from "./helpers/db";

test.describe("Domain events (FND-04)", () => {
  test("updateStudentProgress creates AuditEvent STUDENT_PROGRESS_CHANGED", async ({
    page,
  }) => {
    const studentId = await getStudentIdByCode(TEST_CODES.studentAli);
    const beforeCount = await countAuditEvents("STUDENT_PROGRESS_CHANGED");

    await loginAs(page, TEST_CODES.manager);
    await page.goto(`/students/${studentId}/edit`);
    await expect(page.getByRole("heading", { name: "Прогресс ученика" })).toBeVisible();

    const stepField = page
      .locator(".ant-form-item")
      .filter({ hasText: "Текущий шаг" })
      .locator(".ant-select");
    await stepField.click();
    await page.locator(".ant-select-item-option").nth(1).click();
    await page.getByRole("button", { name: "Сохранить" }).click();

    const afterCount = await countAuditEvents("STUDENT_PROGRESS_CHANGED");
    expect(afterCount).toBeGreaterThan(beforeCount);
  });
});
