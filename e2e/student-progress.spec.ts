import { endOfMonth, startOfMonth } from "date-fns";
import { expect, test, type Page } from "@playwright/test";

import { apiGetAs, TEST_CODES } from "./helpers/api";
import { selectStudentProgressStep } from "./helpers/antd";
import { AUTH_STATE } from "./helpers/auth-state";
import { loginAs } from "./helpers/auth";
import { TEST_USERS } from "./helpers/codes";
import {
  countStudentAdjustmentSessionsInMonth,
  countStudentCountableCompletionsInMonth,
  countStudentPriorCreditCompletions,
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

function currentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return { start: startOfMonth(now), end: endOfMonth(now) };
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
  expect(
    student,
    `student ${studentName} not found in journal API`,
  ).toBeTruthy();
  return student!.currentStepIdx;
}

async function getPortalStepIdx(page: Page): Promise<number> {
  const progressText = await page
    .getByText(/Прогресс: шаг \d+ из \d+/)
    .textContent();
  const match = progressText?.match(/Прогресс: шаг (\d+) из \d+/);
  expect(match, "student portal progress text missing").toBeTruthy();
  return Number(match![1]) - 1;
}

async function getAnalyticsStepsCompleted(
  page: Page,
  studentName: string,
): Promise<number> {
  await page.goto("/analytics");
  await expect(page.getByRole("heading", { name: "Аналитика" })).toBeVisible();

  const row = page.getByRole("row", { name: new RegExp(studentName) });
  await expect(row).toBeVisible();
  const stepsCell = row.getByRole("cell").nth(1);
  const stepsText = await stepsCell.textContent();
  return Number(stepsText?.trim() ?? NaN);
}

test.describe("Student progress sync (FND-03)", () => {
  test.use({ storageState: AUTH_STATE.manager });

  test("manager progress change shows same currentStepIdx in journal and student portal", async ({
    page,
  }) => {
    test.setTimeout(60_000);

    const studentId = await getStudentIdByCode(TEST_CODES.studentAli);
    const groupId = await getGroupIdByName(TEST_USERS.group1);
    const beforeIdx = await getStudentCurrentStepIdx(studentId);
    const targetLocalStep = beforeIdx === 0 ? 1 : 0;
    const { start: monthStart, end: monthEnd } = currentMonthRange();
    const priorCreditsBefore =
      await countStudentPriorCreditCompletions(studentId);

    await page.goto(`/students/${studentId}/edit`);
    await expect(
      page.getByRole("heading", { name: "Прогресс ученика" }),
    ).toBeVisible();

    await selectStudentProgressStep(page, targetLocalStep);
    await page.getByRole("button", { name: "Сохранить" }).click();
    await expect(page).toHaveURL(new RegExp(`/groups/${groupId}`));

    const dbIdx = await getStudentCurrentStepIdx(studentId);
    const journalIdx = await getJournalStepIdx(groupId, TEST_USERS.studentAli);

    await loginAs(page, TEST_CODES.studentAli);
    await page.goto("/student/me");
    const portalIdx = await getPortalStepIdx(page);

    expect(journalIdx).toBe(dbIdx);
    expect(portalIdx).toBe(dbIdx);
    expect(journalIdx).toBe(portalIdx);

    const priorCreditsAfter =
      await countStudentPriorCreditCompletions(studentId);
    if (targetLocalStep > 0) {
      expect(priorCreditsAfter).toBeGreaterThan(priorCreditsBefore);
    }

    const adjustmentSessions = await countStudentAdjustmentSessionsInMonth(
      studentId,
      monthStart,
      monthEnd,
    );
    expect(adjustmentSessions).toBeGreaterThan(0);

    const countableCompletions = await countStudentCountableCompletionsInMonth(
      studentId,
      monthStart,
      monthEnd,
    );

    await loginAs(page, TEST_CODES.manager);
    const analyticsSteps = await getAnalyticsStepsCompleted(
      page,
      TEST_USERS.studentAli,
    );
    expect(analyticsSteps).toBe(countableCompletions);
  });
});
