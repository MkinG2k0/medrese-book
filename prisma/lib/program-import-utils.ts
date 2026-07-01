import { readFileSync } from "node:fs";
import { join } from "node:path";

export type StepDef = {
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

const DATA_DIR = join(process.cwd(), "prisma/data");

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
