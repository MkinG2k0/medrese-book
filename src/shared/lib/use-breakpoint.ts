"use client";

import { Grid } from "antd";

/** true когда ширина viewport < 768px (antd breakpoint md). */
export function useIsMobile(): boolean {
  const screens = Grid.useBreakpoint();
  return !screens.md;
}
