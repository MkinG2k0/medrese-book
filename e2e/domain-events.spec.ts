import { expect, test } from "@playwright/test";

import { TEST_CODES } from "./helpers/api";
import { selectStudentProgressStep } from "./helpers/antd";
import { loginAs } from "./helpers/auth";
import { TEST_USERS } from "./helpers/codes";
import {
  countAuditEvents,
  getGroupIdByName,
  getStudentCurrentStepIdx,
  getStudentIdByCode,
} from "./helpers/db";

test.describe("Domain events (FND-04)", () => {
  test("updateStudentProgress creates AuditEvent STUDENT_PROGRESS_CHANGED", async ({
    page,
  }) => {
    test.setTimeout(30_000);

    const studentId = await getStudentIdByCode(TEST_CODES.studentAli);
    const groupId = await getGroupIdByName(TEST_USERS.group1);
    const beforeIdx = await getStudentCurrentStepIdx(studentId);
    const targetLocalStep = beforeIdx === 0 ? 1 : 0;
    const beforeCount = await countAuditEvents(
      "STUDENT_PROGRESS_CHANGED",
      studentId,
    );

    await loginAs(page, TEST_CODES.manager);
    await page.goto(`/students/${studentId}/edit`);
    await expect(page.getByRole("heading", { name: "Прогресс ученика" })).toBeVisible();

    await selectStudentProgressStep(page, targetLocalStep);
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page).toHaveURL(new RegExp(`/groups/${groupId}`));

    const afterCount = await countAuditEvents(
      "STUDENT_PROGRESS_CHANGED",
      studentId,
    );
    expect(afterCount).toBeGreaterThan(beforeCount);
  });
});
