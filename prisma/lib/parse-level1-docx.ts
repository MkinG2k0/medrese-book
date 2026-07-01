import { existsSync } from "node:fs";
import { join } from "node:path";

import {
  parsePositiveInt,
  parseTableRows,
  readDocxDocumentXml,
} from "./docx-utils";
import {
  getLevelDocxDir,
  LEVEL1_PAGE_DOCX,
  LEVEL_TITLES,
} from "./program-config";

export type ParsedStep = {
  order: number;
  title: string;
  lesson: string;
  letters: string;
  task: string;
  hours: number;
  globalLesson?: number;
  wird?: string;
  rules?: string;
};

export const LEVEL1_TITLE = LEVEL_TITLES[1];
export const LEVEL2_TITLE = LEVEL_TITLES[2];
export const LEVEL3_TITLE = LEVEL_TITLES[3];
export const LEVEL4_TITLE = LEVEL_TITLES[4];
export const LEVEL5_TITLE = LEVEL_TITLES[5];

/** @deprecated Используйте PROGRAM_DOCX_DIR */
export function getDocxDir() {
  return getLevelDocxDir(1);
}

export function getLevel1DocxPath(page: 1 | 2 | 3) {
  return join(getLevelDocxDir(1), LEVEL1_PAGE_DOCX[page]);
}

function parseLevel1Rows(rows: string[][]): ParsedStep[] {
  const steps: ParsedStep[] = [];

  for (const cells of rows.slice(1)) {
    if (cells.length < 5) continue;

    const order = parsePositiveInt(cells[0] ?? "");
    if (!order) continue;

    const lesson = cells[1] ?? "";
    const letters = cells[2] ?? "";
    const task = cells[3] ?? "";
    const hours = Number.parseInt(cells[4] ?? "", 10) || 1;

    steps.push({
      order,
      lesson,
      letters,
      task,
      hours,
      title: task,
    });
  }

  return steps;
}

export function parseLevel1DocxPage(page: 1 | 2 | 3): ParsedStep[] {
  const docxPath = getLevel1DocxPath(page);

  if (!existsSync(docxPath)) {
    throw new Error(
      `DOCX не найден: ${docxPath}. Задайте PROGRAM_DOCX_DIR или положите файлы в ${getLevelDocxDir(1)}`,
    );
  }

  const xml = readDocxDocumentXml(docxPath);
  return parseLevel1Rows(parseTableRows(xml));
}

export function parseAllLevel1DocxPages(): ParsedStep[] {
  return ([1, 2, 3] as const).flatMap((page) => parseLevel1DocxPage(page));
}
