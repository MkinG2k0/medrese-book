import type { PrismaClient } from "../../src/shared/lib/db";

import {
  LEVEL1_TITLE,
  LEVEL2_TITLE,
  LEVEL3_TITLE,
  LEVEL4_TITLE,
  LEVEL5_TITLE,
} from "./program-config";
import {
  buildContent,
  loadAllProgramLevelSteps,
  type StepDef,
} from "./level1-import-utils";

const LEVEL_TITLES = [
  LEVEL1_TITLE,
  LEVEL2_TITLE,
  LEVEL3_TITLE,
  LEVEL4_TITLE,
  LEVEL5_TITLE,
] as const;

export type SeedProgramResult = {
  skipped: boolean;
  levelStepCounts: number[];
};

export type SeedProgramOptions = {
  /** Пропустить загрузку, если уровни уже есть в БД */
  skipIfExists?: boolean;
};

async function createLevelWithSteps(
  prisma: PrismaClient,
  number: number,
  title: string,
  steps: StepDef[],
) {
  const level = await prisma.level.create({
    data: { number, title },
  });

  for (const step of steps) {
    await prisma.step.create({
      data: {
        levelId: level.id,
        order: step.order,
        title: step.title,
        content: buildContent(step),
        hours: step.hours,
      },
    });
  }

  return level;
}

/** Загружает программу обучения (5 уровней) из prisma/data в БД. */
export async function seedProgram(
  prisma: PrismaClient,
  options: SeedProgramOptions = {},
): Promise<SeedProgramResult> {
  const { skipIfExists = false } = options;
  const levelStepDefs = loadAllProgramLevelSteps();
  const levelStepCounts = levelStepDefs.map((steps) => steps.length);

  const existingLevels = await prisma.level.count();
  if (existingLevels > 0) {
    if (skipIfExists) {
      return { skipped: true, levelStepCounts };
    }

    throw new Error(
      "Программа уже загружена. Удалите уровни вручную или используйте полный demo-seed.",
    );
  }

  await Promise.all(
    levelStepDefs.map((steps, index) =>
      createLevelWithSteps(prisma, index + 1, LEVEL_TITLES[index]!, steps),
    ),
  );

  return { skipped: false, levelStepCounts };
}

export function formatProgramSeedSummary(result: SeedProgramResult): string {
  const counts = result.levelStepCounts
    .map((count, index) => `${index + 1}=${count}`)
    .join(", ");

  if (result.skipped) {
    return `Программа уже существует (уровни 1–5: ${counts} шагов)`;
  }

  return `Программа загружена: уровни 1–5 — ${counts} шагов`;
}
