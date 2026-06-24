import { expect, test, type Page } from "@playwright/test";

import { apiGetAs, TEST_CODES } from "./helpers/api";
import { loginAs } from "./helpers/auth";
import { TEST_USERS } from "./helpers/codes";
import {
  getGroupIdByName,
  getStudentCurrentStepIdx,
  getStudentIdByCode,
} from "./helpers/db";

function todayDateParam(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function getJournalStepIdx(
  groupId: string,
  studentName: string,
): Promise<number> {
  const response = await apiGetAs(
    TEST_CODES.teacher1,
    `/api/students?groupId=${groupId}&date=${todayDateParam()}`,
  );
  expect(response.ok()).toBeTruthy();
  const json = (await response.json()) as {
    data: { name: string; currentStepIdx: number }[] | null;
    error: string | null;
  };
  expect(json.error).toBeNull();
  const student = json.data?.find((row) => row.name === studentName);
  expect(student, `student ${studentName} not found in journal API`).toBeTruthy();
  return student!.currentStepIdx;
}

async function getPortalStepIdx(page: Page): Promise<number> {
  const progressText = await page.getByText(/Прогресс: шаг \d+ из \d+/).textContent();
  const match = progressText?.match(/Прогресс: шаг (\d+) из \d+/);
  expect(match, "student portal progress text missing").toBeTruthy();
  return Number(match![1]) - 1;
}

test.describe("Student progress sync (FND-03)", () => {
  test("manager progress change shows same currentStepIdx in journal and student portal", async ({
    page,
  }) => {
    const studentId = await getStudentIdByCode(TEST_CODES.studentAli);
    const groupId = await getGroupIdByName(TEST_USERS.group1);
    const beforeIdx = await getStudentCurrentStepIdx(studentId);
    const targetLocalStep = beforeIdx === 0 ? 1 : 0;

    await loginAs(page, TEST_CODES.manager);
    await page.goto(`/students/${studentId}/edit`);
    await expect(page.getByRole("heading", { name: "Прогресс ученика" })).toBeVisible();

    const stepField = page
      .locator(".ant-form-item")
      .filter({ hasText: "Текущий шаг" })
      .locator(".ant-select");
    await stepField.click();
    await page.locator(".ant-select-item-option").nth(targetLocalStep).click();
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page).toHaveURL(new RegExp(`/groups/${groupId}`));

    const dbIdx = await getStudentCurrentStepIdx(studentId);
    const journalIdx = await getJournalStepIdx(groupId, TEST_USERS.studentAli);

    await loginAs(page, TEST_CODES.studentAli);
    await expect(page).toHaveURL(/\/student\/me/);
    const portalIdx = await getPortalStepIdx(page);

    expect(journalIdx).toBe(dbIdx);
    expect(portalIdx).toBe(dbIdx);
    expect(journalIdx).toBe(portalIdx);
  });
});
