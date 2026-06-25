import { expect, type Locator, type Page } from "@playwright/test";

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

async function waitForModal(page: Page, title: string): Promise<Locator> {
  const modal = page.locator(".ant-modal-wrap").filter({
    has: page.locator(".ant-modal-title", { hasText: title }),
  });
  await expect(modal).toBeVisible({ timeout: 15_000 });
  return modal;
}

export async function createLeaveViaUI(
  page: Page,
  { type, description }: CreateLeaveViaUIParams,
) {
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/leave-requests") &&
        response.status() === 200,
    ),
    page.goto("/calendar", { waitUntil: "domcontentloaded" }),
  ]);

  await page.getByRole("button", { name: CREATE_BUTTON_LABELS[type] }).click();

  const createModal = await waitForModal(page, CREATE_DIALOG_TITLES[type]);
  await createModal.getByTestId("leave-description-input").fill(description);
  await createModal.getByRole("button", { name: "Отправить заявку" }).click();

  await expect(page.getByText("Заявка отправлена на согласование")).toBeVisible();
  await expect(
    page.locator(".ant-modal-title", { hasText: CREATE_DIALOG_TITLES[type] }),
  ).toHaveCount(0);
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
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/leave-requests") &&
        response.status() === 200,
    ),
    page.goto("/admin/leave-calendar", { waitUntil: "domcontentloaded" }),
  ]);
  await expect(
    page.getByRole("heading", { name: "Календарь отпусков" }),
  ).toBeVisible();

  const row = getManagerRequestRow(page, teacherName, description);
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Подтвердить" }).click();

  const modal = await waitForModal(page, "Подтвердить заявку");
  await modal.locator(".ant-select").click();
  await page.getByTitle(substituteName, { exact: true }).click();
  await modal.getByRole("button", { name: "Подтвердить заявку" }).click();

  await expect(
    page.getByText("Заявка подтверждена, замещение активировано"),
  ).toBeVisible();
}

export async function rejectLeaveViaUI(
  page: Page,
  teacherName: string,
  reason: string,
  description: string,
) {
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/leave-requests") &&
        response.status() === 200,
    ),
    page.goto("/admin/leave-calendar", { waitUntil: "domcontentloaded" }),
  ]);
  await expect(
    page.getByRole("heading", { name: "Календарь отпусков" }),
  ).toBeVisible();

  const row = getManagerRequestRow(page, teacherName, description);
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Отклонить" }).click();

  const rejectModal = await waitForModal(page, "Отклонить заявку");
  await rejectModal.getByTestId("leave-rejection-reason-input").fill(reason);
  await rejectModal.getByRole("button", { name: "Отклонить", exact: true }).click();

  await expect(page.getByText("Заявка отклонена")).toBeVisible();
}

export async function editRejectedLeaveViaUI(
  page: Page,
  description: string,
  newDescription: string,
) {
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/leave-requests") &&
        response.status() === 200,
    ),
    page.goto("/calendar", { waitUntil: "domcontentloaded" }),
  ]);
  await page.locator(".ant-select").filter({ hasText: "Все статусы" }).click();
  await page.getByTitle("Отклонена", { exact: true }).click();

  const row = page.getByRole("row").filter({ hasText: description });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Изменить" }).click();

  const editModal = await waitForModal(page, "Редактировать заявку");
  await editModal.getByTestId("leave-description-input").fill(newDescription);
  await editModal.getByRole("button", { name: "Сохранить и отправить" }).click();

  await expect(
    page.getByText("Заявка изменена и снова отправлена на согласование"),
  ).toBeVisible();
}

export async function switchToSubstitutedTeacher(page: Page, teacherName: string) {
  const switcher = page
    .getByRole("button")
    .filter({ has: page.locator(".ant-avatar") });
  await expect(switcher).toBeVisible();
  await switcher.click();

  const menuItem = page
    .locator(".ant-dropdown-menu-item")
    .filter({ hasText: teacherName });
  await expect(menuItem).toBeVisible();
  await menuItem.click();

  await expect(page.getByRole("banner").getByText(teacherName)).toBeVisible();
}
