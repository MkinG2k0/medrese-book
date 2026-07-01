import { existsSync } from "node:fs";
import { join } from "node:path";

import {
  parsePositiveInt,
  parseTableRows,
  readDocxDocumentXml,
} from "./docx-utils";
import type { ParsedStep } from "./parse-level1-docx";
import {
  getLevelDocxDir,
  LEVEL2_DOCX,
  LEVEL3_PAGE_DOCX,
  LEVEL3_RULES_DOCX,
  LEVEL4_PAGE_DOCX,
  LEVEL5_PAGE_DOCX,
} from "./program-config";

export type RuleDef = {
  globalLesson: number;
  rule: string;
  page: string;
  ayah: string;
  surah: string;
  number: number;
};

function requireDocx(path: string): string {
  if (!existsSync(path)) {
    throw new Error(`DOCX не найден: ${path}`);
  }
  return path;
}

function parseLevel2Rows(rows: string[][]): ParsedStep[] {
  const steps: ParsedStep[] = [];

  for (const cells of rows.slice(2)) {
    if (cells.length < 3) continue;

    const order = parsePositiveInt(cells[0] ?? "");
    if (!order) continue;

    const globalLesson = parsePositiveInt(cells[1] ?? "") ?? undefined;
    const task = cells[2] ?? "";
    const rules = cells[3] ?? "";

    steps.push({
      order,
      globalLesson,
      lesson: globalLesson ? `Урок ${globalLesson}` : "",
      letters: rules,
      task,
      hours: 1,
      title: globalLesson ? `Урок ${globalLesson}` : `Шаг ${order}`,
      rules,
    });
  }

  return steps;
}

function parseLevel3PageRows(rows: string[][]): ParsedStep[] {
  const steps: ParsedStep[] = [];

  for (const cells of rows.slice(2)) {
    if (cells.length < 3) continue;

    const order = parsePositiveInt(cells[0] ?? "");
    if (!order) continue;

    const globalLesson = parsePositiveInt(cells[1] ?? "") ?? undefined;
    const lesson = cells[2] ?? "";

    steps.push({
      order,
      globalLesson,
      lesson,
      letters: "",
      task: lesson,
      hours: 1,
      title: lesson || (globalLesson ? `Урок ${globalLesson}` : `Шаг ${order}`),
    });
  }

  return steps;
}

function parseLevel4Or5PageRows(rows: string[][]): ParsedStep[] {
  const steps: ParsedStep[] = [];

  for (const cells of rows.slice(2)) {
    if (cells.length < 3) continue;

    const order = parsePositiveInt(cells[0] ?? "");
    if (!order) continue;

    const globalLesson = parsePositiveInt(cells[1] ?? "") ?? undefined;
    const lesson = cells[2] ?? "";
    const wird = cells[6] ?? "";

    steps.push({
      order,
      globalLesson,
      lesson,
      letters: wird,
      task: lesson,
      hours: 1,
      title: lesson || (globalLesson ? `Урок ${globalLesson}` : `Шаг ${order}`),
      wird: wird || undefined,
    });
  }

  return steps;
}

function parseLevel3RulesRows(rows: string[][]): RuleDef[] {
  const rules: RuleDef[] = [];

  for (const cells of rows) {
    if (cells.length < 7) continue;

    const globalLesson = parsePositiveInt(cells[0] ?? "");
    const number = parsePositiveInt(cells[6] ?? "");
    if (!globalLesson || !number) continue;

    rules.push({
      globalLesson,
      rule: cells[1] ?? "",
      page: cells[2] ?? "",
      ayah: cells[3] ?? "",
      surah: cells[4] ?? "",
      number,
    });
  }

  return rules;
}

export function parseLevel2Docx(): ParsedStep[] {
  const docxPath = requireDocx(join(getLevelDocxDir(2), LEVEL2_DOCX));
  const xml = readDocxDocumentXml(docxPath);
  return parseLevel2Rows(parseTableRows(xml));
}

export function parseLevel3DocxPage(page: 1 | 2 | 3 | 4 | 5 | 6): ParsedStep[] {
  const docxPath = requireDocx(
    join(getLevelDocxDir(3), LEVEL3_PAGE_DOCX[page]),
  );
  const xml = readDocxDocumentXml(docxPath);
  return parseLevel3PageRows(parseTableRows(xml));
}

export function parseLevel3RulesDocx(): RuleDef[] {
  const docxPath = requireDocx(join(getLevelDocxDir(3), LEVEL3_RULES_DOCX));
  const xml = readDocxDocumentXml(docxPath);
  return parseLevel3RulesRows(parseTableRows(xml));
}

export function parseLevel4DocxPage(page: 1 | 2 | 3 | 4 | 5 | 6): ParsedStep[] {
  const docxPath = requireDocx(
    join(getLevelDocxDir(4), LEVEL4_PAGE_DOCX[page]),
  );
  const xml = readDocxDocumentXml(docxPath);
  return parseLevel4Or5PageRows(parseTableRows(xml));
}

export function parseLevel5DocxPage(page: 1 | 2): ParsedStep[] {
  const docxPath = requireDocx(
    join(getLevelDocxDir(5), LEVEL5_PAGE_DOCX[page]),
  );
  const xml = readDocxDocumentXml(docxPath);
  return parseLevel4Or5PageRows(parseTableRows(xml));
}

export function parseAllLevel3DocxPages(): ParsedStep[] {
  return ([1, 2, 3, 4, 5, 6] as const).flatMap((page) =>
    parseLevel3DocxPage(page),
  );
}

export function parseAllLevel4DocxPages(): ParsedStep[] {
  return ([1, 2, 3, 4, 5, 6] as const).flatMap((page) =>
    parseLevel4DocxPage(page),
  );
}

export function parseAllLevel5DocxPages(): ParsedStep[] {
  return ([1, 2] as const).flatMap((page) => parseLevel5DocxPage(page));
}
