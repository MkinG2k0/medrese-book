import type { Locator, Page } from "@playwright/test";

/** Клик по Ant Design Radio.Button — скрытый input не кликабелен напрямую. */
export function clickRadioButton(scope: Page | Locator, label: string) {
  return scope
    .locator(".ant-radio-button-wrapper")
    .filter({ hasText: label })
    .click();
}
