import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export type StepContentBlocks = {
  blocks: Array<
    | { type: "text"; value: string }
    | { type: "arabic"; value: string; size?: "md" | "lg" | "xl" }
    | { type: "image"; url: string; caption?: string | null }
    | { type: "list"; items: string[] }
  >;
};

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
  pdfUrl?: string | null;
  content?: StepContentBlocks;
};

const DATA_DIR = join(process.cwd(), "prisma/data");
const LEVEL1_UPLOADS_DIR = join(
  process.cwd(),
  "public/uploads/program/level1",
);

function loadJson<T>(fileName: string): T {
  return JSON.parse(readFileSync(join(DATA_DIR, fileName), "utf8")) as T;
}

function resolveLevel1PdfUrl(order: number): string | null {
  const pdfPath = join(LEVEL1_UPLOADS_DIR, `step-${order}`, "lesson.pdf");
  if (!existsSync(pdfPath)) {
    return null;
  }
  return `/uploads/program/level1/step-${order}/lesson.pdf`;
}

export function loadLevel1PageSteps(page: 1 | 2 | 3): StepDef[] {
  return loadJson<StepDef[]>(`level1-page${page}.json`);
}

export function loadAllLevel1Steps(): StepDef[] {
  return ([1, 2, 3] as const)
    .flatMap((page) => loadLevel1PageSteps(page))
    .map((step) => ({
      ...step,
      content: { blocks: [] },
      pdfUrl: resolveLevel1PdfUrl(step.order),
    }));
}

export function resolveStepContent(step: StepDef): StepContentBlocks {
  if (step.content !== undefined) {
    return step.content;
  }
  return buildContent(step);
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

/** Объём в страницах из таблицы программы («1 стр.»), не буквы шага. */
function isPageVolume(text: string) {
  return /^\d+\s*стр\.?$/i.test(text.trim());
}

function trimField(text: string | undefined) {
  return text?.trim() ?? "";
}

export function buildContent(step: StepDef) {
  const blocks: Array<
    | { type: "text"; value: string }
    | { type: "arabic"; value: string; size?: "md" | "lg" | "xl" }
    | { type: "list"; items: string[] }
  > = [];

  const lesson = trimField(step.lesson);
  const task = trimField(step.task);
  const letters = trimField(step.letters);
  const wird = trimField(step.wird);

  if (lesson) {
    blocks.push({ type: "text", value: `Урок: ${lesson}` });
  }

  const showLetters =
    letters.length > 0 && !isPageVolume(letters) && letters !== wird;

  if (showLetters) {
    if (hasArabic(letters)) {
      blocks.push({ type: "text", value: "Буквы шага:" });
      blocks.push({ type: "arabic", value: letters, size: "lg" });
    } else {
      blocks.push({ type: "text", value: `Буквы шага: ${letters}` });
    }
  }

  if (wird) {
    blocks.push({ type: "text", value: `Вирд: ${wird}` });
  }

  if (step.rules) {
    blocks.push({ type: "text", value: `Правила: ${step.rules}` });
  }

  if (task && task !== lesson) {
    blocks.push({ type: "text", value: "Основное задание:" });
    if (hasArabic(task)) {
      blocks.push({ type: "arabic", value: task, size: "xl" });
    } else {
      blocks.push({ type: "text", value: task });
    }
  }

  return { blocks };
}
