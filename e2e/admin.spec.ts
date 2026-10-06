import { expect, test } from "@playwright/test";

import { AUTH_STATE } from "./helpers/auth-state";
import { TEST_USERS } from "./helpers/codes";
import { getGroupIdByName } from "./helpers/db";

test.describe("Админ-панель менеджера", () => {
  test.use({ storageState: AUTH_STATE.manager });

  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "Пользователи" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Али", exact: true })).toBeVisible();
  });

  test("отображает список пользователей", async ({ page }) => {
    await expect(
      page.getByRole("cell", { name: "Учитель Ахмад", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: "Али", exact: true })).toBeVisible();
    await expect(
      page.getByRole("cell", { name: TEST_USERS.parentAliUsman, exact: true }),
    ).toBeVisible();
  });

  test("открывает карточку пользователя по клику на строку", async ({ page }) => {
    await page.getByRole("row", { name: /Али/ }).click();

    const detailDialog = page.getByRole("dialog");
    await expect(detailDialog).toBeVisible();
    await expect(detailDialog.getByText("Ученик")).toBeVisible();
    await expect(detailDialog.getByText(TEST_USERS.group1)).toBeVisible();
    await expect(detailDialog.getByRole("heading", { level: 4 })).toHaveText(/^\d{6}$/);
    await expect(detailDialog.getByRole("button", { name: "Сохранить" })).toBeVisible();

    await detailDialog.getByRole("button", { name: "Закрыть" }).click();
    await expect(detailDialog).toBeHidden();
  });

  test("фильтрует пользователей по имени, роли и группе", async ({ page }) => {
    const nameHeader = page.getByRole("columnheader", { name: "Имя" });
    await nameHeader.locator(".ant-table-filter-trigger").click();
    const nameFilter = page.locator(".ant-table-filter-dropdown").last();
    await nameFilter.getByPlaceholder("Поиск по имени").fill("Али");
    await nameFilter.getByRole("button", { name: "Найти" }).click();
    await expect(page.getByRole("cell", { name: "Али", exact: true })).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Учитель Ахмад", exact: true }),
    ).toHaveCount(0);

    await nameHeader.locator(".ant-table-filter-trigger").click();
    await nameFilter.getByRole("button", { name: "Сбросить" }).click();

    const roleHeader = page.getByRole("columnheader", { name: "Роль" });
    await roleHeader.locator(".ant-table-filter-trigger").click();
    const roleFilter = page.locator(".ant-table-filter-dropdown").last();
    await roleFilter.getByText("Учитель", { exact: true }).click();
    await roleFilter.getByRole("button", { name: "ОК" }).click();
    await expect(
      page.getByRole("cell", { name: "Учитель Ахмад", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: "Али", exact: true })).toHaveCount(0);

    await roleHeader.locator(".ant-table-filter-trigger").click();
    await roleFilter.getByRole("button", { name: "Сбросить" }).click();
    await roleFilter.getByRole("button", { name: "ОК" }).click();

    const groupHeader = page.getByRole("columnheader", { name: "Группа" });
    await groupHeader.locator(".ant-table-filter-trigger").click();
    const groupFilter = page.locator(".ant-table-filter-dropdown").last();
    await groupFilter.getByText(TEST_USERS.group1, { exact: true }).click();
    await groupFilter.getByRole("button", { name: "ОК" }).click();
    await expect(page.getByRole("cell", { name: "Али", exact: true })).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Учитель Ахмад", exact: true }),
    ).toBeVisible();
  });

  test("создаёт нового ученика", async ({ page }) => {
    const studentName = `Ученик E2E ${Date.now()}`;

    await page.getByRole("button", { name: "Создать пользователя" }).click();
    const createDialog = page.getByRole("dialog", { name: "Создать пользователя" });
    await expect(createDialog).toBeVisible();

    await createDialog.getByPlaceholder("Ибрагимов Камал Ахмедович").fill(studentName);
    await createDialog.locator('.ant-select[name="groupId"]').click();
    await page.getByTitle(TEST_USERS.group1).click();
    await expect(createDialog.locator('.ant-select[name="levelId"]')).not.toBeDisabled();
    await createDialog.getByRole("button", { name: "Создать" }).click();

    const codeDialog = page.getByRole("dialog", { name: "Код доступа" });
    await expect(codeDialog).toBeVisible();
    await expect(codeDialog.getByText(studentName)).toBeVisible();
    await expect(codeDialog.getByRole("heading", { level: 3 })).toHaveText(/^\d{6}$/);
    await codeDialog.getByRole("button", { name: "Понятно" }).click();
    await expect(page.getByRole("cell", { name: studentName, exact: true })).toBeVisible();

    const groupId = await getGroupIdByName(TEST_USERS.group1);
    await page.goto(`/groups/${groupId}`);
    await expect(page.getByRole("cell", { name: studentName, exact: true })).toBeVisible();
  });

  test("создаёт опекуна и опционально прикрепляет ученика", async ({ page }) => {
    const studentName = `Ученик опекуна E2E ${Date.now()}`;
    const parentName = `Опекун E2E ${Date.now()}`;

    await page.getByRole("button", { name: "Создать пользователя" }).click();
    const createStudentDialog = page.getByRole("dialog", { name: "Создать пользователя" });
    await createStudentDialog.getByPlaceholder("Ибрагимов Камал Ахмедович").fill(studentName);
    await createStudentDialog.locator('.ant-select[name="groupId"]').click();
    await page.getByTitle(TEST_USERS.group1).click();
    await expect(createStudentDialog.locator('.ant-select[name="levelId"]')).not.toBeDisabled();
    await createStudentDialog.getByRole("button", { name: "Создать" }).click();
    await page.getByRole("dialog", { name: /доступ/ }).getByRole("button", { name: "Понятно" }).click();
    await expect(page.getByRole("cell", { name: studentName, exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Создать пользователя" }).click();
    const createParentDialog = page.getByRole("dialog", { name: "Создать пользователя" });
    await expect(createParentDialog).toBeVisible();

    await createParentDialog.locator(".ant-form-item").filter({ hasText: "Роль" }).getByRole("combobox").click();
    await page.locator(".ant-select-dropdown:visible").getByTitle("Опекун", { exact: true }).click();
    await createParentDialog.getByPlaceholder("Ибрагимова Амина").fill(parentName);

    const studentSelect = createParentDialog
      .locator(".ant-form-item")
      .filter({ hasText: "Ученики" })
      .getByRole("combobox");
    await studentSelect.click();
    await studentSelect.fill(studentName);
    await page
      .locator(".ant-select-dropdown:visible .ant-select-item-option")
      .filter({ hasText: studentName })
      .click();
    await createParentDialog.getByPlaceholder("Ибрагимова Амина").click();

    await createParentDialog.getByRole("button", { name: "Создать" }).click();
    const codeDialog = page.getByRole("dialog", { name: "Код доступа" });
    await expect(codeDialog).toBeVisible();
    await expect(codeDialog.getByText(parentName)).toBeVisible();
    await expect(codeDialog.getByText("Опекун")).toBeVisible();
    await codeDialog.getByRole("button", { name: "Понятно" }).click();

    await expect(page.getByRole("cell", { name: parentName, exact: true })).toBeVisible();

    await page.getByRole("cell", { name: studentName, exact: true }).click();
    const detailDialog = page.getByRole("dialog");
    await expect(detailDialog).toBeVisible();
    await expect(detailDialog.locator(".ant-form-item").filter({ hasText: "Опекун" })).toContainText(
      parentName,
    );
    await detailDialog.getByRole("button", { name: "Закрыть" }).click();
  });

  test("удаляет ученика из карточки пользователя", async ({ page }) => {
    const studentName = `Удалить E2E ${Date.now()}`;

    await page.getByRole("button", { name: "Создать пользователя" }).click();
    const createDialog = page.getByRole("dialog", { name: "Создать пользователя" });
    await createDialog.getByPlaceholder("Ибрагимов Камал Ахмедович").fill(studentName);
    await createDialog.locator('.ant-select[name="groupId"]').click();
    await page.getByTitle(TEST_USERS.group1).click();
    await expect(createDialog.locator('.ant-select[name="levelId"]')).not.toBeDisabled();
    await createDialog.getByRole("button", { name: "Создать" }).click();
    await page.getByRole("dialog", { name: "Код доступа" }).getByRole("button", { name: "Понятно" }).click();

    await page.getByRole("row", { name: new RegExp(studentName) }).click();
    const detailDialog = page.getByRole("dialog");
    await detailDialog.getByRole("button", { name: "Удалить" }).click();

    const confirmDialog = page.getByRole("dialog", { name: "Удалить пользователя?" });
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole("button", { name: "Удалить" }).click();

    await expect(detailDialog).toBeHidden();
    await expect(page.getByRole("cell", { name: studentName, exact: true })).toHaveCount(0);
  });

  test("открывает страницу программы", async ({ page }) => {
    await page.getByRole("menuitem", { name: "Программа" }).click();
    await expect(page).toHaveURL(/\/admin\/program/);
    await expect(page.getByRole("heading", { name: "Программа обучения" })).toBeVisible();
  });

  test("открывает страницу наград", async ({ page }) => {
    await page.getByRole("menuitem", { name: "Награды" }).click();
    await expect(page).toHaveURL(/\/admin\/awards/);
    await expect(page.getByRole("heading", { name: "Награды" })).toBeVisible();
  });

  test("не показывает кнопку сброса кода", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Сбросить код" })).toHaveCount(0);
  });
});

test.describe("Админ-панель супер-админа", () => {
  test.use({ storageState: AUTH_STATE.superAdmin });

  test("может сбросить код пользователя", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "Пользователи" })).toBeVisible();

    const resetButton = page
      .getByRole("row", { name: /Зайд/ })
      .getByRole("button", { name: "Сбросить код" });
    await resetButton.click();

    const codeDialog = page.getByRole("dialog", { name: "Код доступа" });
    await expect(codeDialog).toBeVisible();
    await expect(codeDialog.getByRole("heading", { level: 3 })).toHaveText(/^\d{6}$/);
    await codeDialog.getByRole("button", { name: "Понятно" }).click();
  });
});
