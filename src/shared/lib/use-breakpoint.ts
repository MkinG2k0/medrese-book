"use client";

import { Grid } from "antd";

/**
 * true когда ширина viewport < 768px (antd breakpoint md).
 *
 * До измерения antd `screens.md` === undefined. Нельзя писать `!screens.md`:
 * иначе после reload десктоп ошибочно считается мобильным и сайдбар пропадает.
 */
export function useIsMobile(): boolean {
  const screens = Grid.useBreakpoint();
  return screens.md === false;
}
