import { expect, type Page } from "@playwright/test";

type LeaveUiType = "vacation" | "dayoff" | "sick";

const CREATE_BUTTON_LABELS: Record<LeaveUiType, string> = {
  vacation: "Создать отпуск",
  dayoff: "Создать отгул",
  sick: "Создать больничный",
};

const CREATE_DIALOG_TITLES: Record<LeaveUiType, string> = {
  vacation: "Новый отпуск",
  dayoff: "Новый отгул",
  sick: "Новый больничный",
};

type CreateLeaveViaUIParams = {
  type: LeaveUiType;
  startLabel?: string;
  endLabel?: string;
  description: string;
};

export function uniqueLeaveDescription(prefix: string) {
  return `${prefix} E2E ${Date.now()}`;
}

export async function createLeaveViaUI(
  page: Page,
  { type, description }: CreateLeaveViaUIParams,
) {
  await page.goto("/calendar");
  await expect(page.getByRole("heading", { name: "Календарь" })).toBeVisible();

  await page.getByRole("button", { name: CREATE_BUTTON_LABELS[type] }).click();

  const dialog = page.getByRole("dialog", {
    name: CREATE_DIALOG_TITLES[type],
  });
  await expect(dialog).toBeVisible();

  await dialog.getByRole("textbox").fill(description);
  await dialog.getByRole("button", { name: "Отправить заявку" }).click();

  await expect(page.getByText("Заявка отправлена на согласование")).toBeVisible();
  await expect(dialog).toHaveCount(0);
}

function getManagerRequestRow(page: Page, teacherName: string, description: string) {
  return page
    .getByRole("row")
    .filter({ hasText: teacherName })
    .filter({ hasText: description });
}

export async function approveLeaveViaUI(
  page: Page,
  teacherName: string,
  substituteName: string,
  description: string,
) {
  await page.goto("/admin/leave-calendar");
  await expect(
    page.getByRole("heading", { name: "Календарь отпусков" }),
  ).toBeVisible();

  const row = getManagerRequestRow(page, teacherName, description);
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Подтвердить" }).click();

  const dialog = page.getByRole("dialog", { name: "Подтвердить заявку" });
  await expect(dialog).toBeVisible();

  await dialog.locator(".ant-select").click();
  await page.getByTitle(substituteName, { exact: true }).click();
  await dialog.getByRole("button", { name: "Подтвердить заявку" }).click();

  await expect(
    page.getByText("Заявка подтверждена, замещение активировано"),
  ).toBeVisible();
  await expect(dialog).toHaveCount(0);
}

export async function rejectLeaveViaUI(
  page: Page,
  teacherName: string,
  reason: string,
  description: string,
) {
  await page.goto("/admin/leave-calendar");
  await expect(
    page.getByRole("heading", { name: "Календарь отпусков" }),
  ).toBeVisible();

  const row = getManagerRequestRow(page, teacherName, description);
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Отклонить" }).click();

  const dialog = page.getByRole("dialog", { name: "Отклонить заявку" });
  await expect(dialog).toBeVisible();

  await dialog.getByRole("textbox").fill(reason);
  await dialog.getByRole("button", { name: "Отклонить", exact: true }).click();

  await expect(page.getByText("Заявка отклонена")).toBeVisible();
  await expect(dialog).toHaveCount(0);
}

export async function editRejectedLeaveViaUI(
  page: Page,
  description: string,
  newDescription: string,
) {
  await page.goto("/calendar");
  await page.locator(".ant-select").filter({ hasText: "Все статусы" }).click();
  await page.getByTitle("Отклонена", { exact: true }).click();

  const row = page.getByRole("row").filter({ hasText: description });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Изменить" }).click();

  const dialog = page.getByRole("dialog", { name: "Редактировать заявку" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("textbox").fill(newDescription);
  await dialog.getByRole("button", { name: "Сохранить и отправить" }).click();

  await expect(
    page.getByText("Заявка изменена и снова отправлена на согласование"),
  ).toBeVisible();
  await expect(dialog).toHaveCount(0);
}

export async function switchToSubstitutedTeacher(page: Page, teacherName: string) {
  await page.getByRole("button").filter({ has: page.locator(".ant-avatar") }).click();
  await page.getByRole("menuitem").filter({ hasText: teacherName }).click();
  await expect(page.getByRole("banner").getByText(teacherName)).toBeVisible();
}
