import { readFileSync } from "node:fs";
import { join } from "node:path";

export type StepDef = {
  order: number;
  title: string;
  lesson: string;
  letters: string;
  task: string;
  hours: number;
};

export function loadLevel1PageSteps(page: 1 | 2 | 3): StepDef[] {
  return JSON.parse(
    readFileSync(
      join(process.cwd(), `prisma/data/level1-page${page}.json`),
      "utf8",
    ),
  ) as StepDef[];
}

export function getPageOrderRange(page: 1 | 2 | 3): { from: number; to: number } {
  const steps = loadLevel1PageSteps(page);
  const orders = steps.map((step) => step.order);
  return { from: Math.min(...orders), to: Math.max(...orders) };
}

/** Смещение для глобальной нумерации шагов (1-й уровень = 0, 2-й = 33, …). */
export function applyGlobalOrderOffset(
  steps: StepDef[],
  offset: number,
): StepDef[] {
  return steps.map((step, index) => ({
    ...step,
    order: offset + index + 1,
  }));
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
