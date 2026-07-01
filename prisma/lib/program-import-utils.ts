import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { parseLevel1DocxPage } from "./parse-level1-docx";
import {
  parseLevel2Docx,
  parseLevel3DocxPage,
  parseLevel3RulesDocx,
  parseLevel4DocxPage,
  parseLevel5DocxPage,
  type RuleDef,
} from "./parse-program-docx";
import type { ParsedStep } from "./parse-level1-docx";

export type StepDef = ParsedStep;

const DATA_DIR = join(process.cwd(), "prisma/data");

function writeJson(fileName: string, data: unknown) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(
    join(DATA_DIR, fileName),
    `${JSON.stringify(data, null, 2)}\n`,
    "utf8",
  );
}

function loadJson<T>(fileName: string): T {
  return JSON.parse(readFileSync(join(DATA_DIR, fileName), "utf8")) as T;
}

export function loadLevel1PageSteps(page: 1 | 2 | 3): StepDef[] {
  return loadJson<StepDef[]>(`level1-page${page}.json`);
}

export function loadAllLevel1Steps(): StepDef[] {
  return ([1, 2, 3] as const).flatMap((page) => loadLevel1PageSteps(page));
}

export function loadLevel2Steps(): StepDef[] {
  return loadJson<StepDef[]>("level2.json");
}

export function loadLevel3PageSteps(page: 1 | 2 | 3 | 4 | 5 | 6): StepDef[] {
  return loadJson<StepDef[]>(`level3-page${page}.json`);
}

export function loadAllLevel3Steps(): StepDef[] {
  return ([1, 2, 3, 4, 5, 6] as const).flatMap((page) =>
    loadLevel3PageSteps(page),
  );
}

export function loadLevel3Rules(): RuleDef[] {
  return loadJson<RuleDef[]>("level3-rules.json");
}

export function loadLevel4PageSteps(page: 1 | 2 | 3 | 4 | 5 | 6): StepDef[] {
  return loadJson<StepDef[]>(`level4-page${page}.json`);
}

export function loadAllLevel4Steps(): StepDef[] {
  return ([1, 2, 3, 4, 5, 6] as const).flatMap((page) =>
    loadLevel4PageSteps(page),
  );
}

export function loadLevel5PageSteps(page: 1 | 2): StepDef[] {
  return loadJson<StepDef[]>(`level5-page${page}.json`);
}

export function loadAllLevel5Steps(): StepDef[] {
  return ([1, 2] as const).flatMap((page) => loadLevel5PageSteps(page));
}

/** Все 5 уровней программы из prisma/data (33 + 168 + 159 + 158 + 37 шагов). */
export function loadAllProgramLevelSteps(): StepDef[][] {
  return [
    loadAllLevel1Steps(),
    loadLevel2Steps(),
    loadAllLevel3Steps(),
    loadAllLevel4Steps(),
    loadAllLevel5Steps(),
  ];
}

/** @deprecated Используйте loadAllProgramLevelSteps */
export function loadSeedLevelSteps(): StepDef[][] {
  return loadAllProgramLevelSteps();
}

export function getPageOrderRange(page: 1 | 2 | 3): { from: number; to: number } {
  const steps = loadLevel1PageSteps(page);
  const orders = steps.map((step) => step.order);
  return { from: Math.min(...orders), to: Math.max(...orders) };
}

export function hasArabic(text: string) {
  return /[\u0600-\u06FF]/.test(text);
}

export function buildContent(step: StepDef) {
  const blocks: Array<
    | { type: "text"; value: string }
    | { type: "arabic"; value: string; size?: "md" | "lg" | "xl" }
    | { type: "list"; items: string[] }
  > = [];

  if (step.lesson) {
    blocks.push({ type: "text", value: `Урок: ${step.lesson}` });
  }

  if (step.letters) {
    if (hasArabic(step.letters)) {
      blocks.push({ type: "text", value: "Буквы шага:" });
      blocks.push({ type: "arabic", value: step.letters, size: "lg" });
    } else {
      blocks.push({ type: "text", value: `Буквы шага: ${step.letters}` });
    }
  }

  if (step.wird) {
    blocks.push({ type: "text", value: `Вирд: ${step.wird}` });
  }

  if (step.rules) {
    blocks.push({ type: "text", value: `Правила: ${step.rules}` });
  }

  if (step.task) {
    blocks.push({ type: "text", value: "Основное задание:" });
    if (hasArabic(step.task)) {
      blocks.push({ type: "arabic", value: step.task, size: "xl" });
    } else {
      blocks.push({ type: "text", value: step.task });
    }
  }

  return { blocks };
}

/** Сохраняет JSON-снимок 1-го уровня из DOCX. */
export function syncLevel1JsonFromDocx() {
  for (const page of [1, 2, 3] as const) {
    writeJson(`level1-page${page}.json`, parseLevel1DocxPage(page));
  }
}

/** Сохраняет JSON-снимки всей программы (уровни 1–5) из DOCX. */
export function syncProgramJsonFromDocx() {
  syncLevel1JsonFromDocx();

  writeJson("level2.json", parseLevel2Docx());

  for (const page of [1, 2, 3, 4, 5, 6] as const) {
    writeJson(`level3-page${page}.json`, parseLevel3DocxPage(page));
  }
  writeJson("level3-rules.json", parseLevel3RulesDocx());

  for (const page of [1, 2, 3, 4, 5, 6] as const) {
    writeJson(`level4-page${page}.json`, parseLevel4DocxPage(page));
  }

  for (const page of [1, 2] as const) {
    writeJson(`level5-page${page}.json`, parseLevel5DocxPage(page));
  }
}

export type ProgramSyncReport = {
  level1: number[];
  level2: number;
  level3: number[];
  level3Rules: number;
  level4: number[];
  level5: number[];
};

export function syncProgramJsonFromDocxWithReport(): ProgramSyncReport {
  syncProgramJsonFromDocx();

  return {
    level1: ([1, 2, 3] as const).map((page) => loadLevel1PageSteps(page).length),
    level2: loadLevel2Steps().length,
    level3: ([1, 2, 3, 4, 5, 6] as const).map((page) =>
      loadLevel3PageSteps(page).length,
    ),
    level3Rules: loadLevel3Rules().length,
    level4: ([1, 2, 3, 4, 5, 6] as const).map((page) =>
      loadLevel4PageSteps(page).length,
    ),
    level5: ([1, 2] as const).map((page) => loadLevel5PageSteps(page).length),
  };
}
