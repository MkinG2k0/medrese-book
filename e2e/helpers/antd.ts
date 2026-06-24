import type { Locator, Page } from "@playwright/test";

/** Клик по Ant Design Radio.Button — скрытый input не кликабелен напрямую. */
export function clickRadioButton(scope: Page | Locator, label: string) {
  return scope
    .locator(".ant-radio-button-wrapper")
    .filter({ hasText: label })
    .click();
}

/** Выбор локального шага на форме «Прогресс ученика». */
export async function selectStudentProgressStep(
  page: Page,
  localStepIndex: number,
) {
  const stepField = page
    .locator(".ant-form-item")
    .filter({ hasText: "Текущий шаг" })
    .getByRole("combobox");
  await stepField.scrollIntoViewIfNeeded();
  await stepField.click({ force: true });
  const option = page
    .locator(".ant-select-dropdown:visible .ant-select-item-option")
    .nth(localStepIndex);
  await option.scrollIntoViewIfNeeded();
  await option.click();
}
