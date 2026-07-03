import { expect, test } from "@playwright/test";

import { TEST_CODES } from "./helpers/api";
import { selectStudentProgressStep } from "./helpers/antd";
import { AUTH_STATE } from "./helpers/auth-state";
import { TEST_USERS } from "./helpers/codes";
import {
  countAuditEvents,
  deleteLeaveRequestsByDescriptionContaining,
  getGroupIdByName,
  getLatestAuditEvent,
  getStudentCurrentStepIdx,
  getStudentIdByCode,
  isLeaveSchemaAvailable,
} from "./helpers/db";
import {
  createLeaveViaUI,
  uniqueLeaveDescription,
} from "./helpers/leave-requests";

test.describe("Domain events (FND-04)", () => {
  test.use({ storageState: AUTH_STATE.manager });

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

test.describe("Domain events leave requests", () => {
  test.use({ storageState: AUTH_STATE.teacher1 });

  test("createLeaveRequest emits LEAVE_REQUEST_CREATED audit event", async ({
    page,
  }) => {
    test.skip(
      !(await isLeaveSchemaAvailable()),
      "LeaveRequest schema missing in test DATABASE_URL",
    );

    const description = uniqueLeaveDescription("Domain events leave");
    const beforeCount = await countAuditEvents("LEAVE_REQUEST_CREATED");

    await createLeaveViaUI(page, {
      type: "dayoff",
      description,
    });

    const afterCount = await countAuditEvents("LEAVE_REQUEST_CREATED");
    expect(afterCount).toBeGreaterThan(beforeCount);

    const latest = await getLatestAuditEvent("LEAVE_REQUEST_CREATED");
    expect(latest).not.toBeNull();
    expect(latest?.action).toBe("LEAVE_REQUEST_CREATED");

    await deleteLeaveRequestsByDescriptionContaining(description);
  });
});
