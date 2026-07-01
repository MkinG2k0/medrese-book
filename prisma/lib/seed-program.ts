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
  resynced: boolean;
  levelStepCounts: number[];
};

export type SeedProgramOptions = {
  /** Пропустить загрузку, если уровни уже есть в БД */
  skipIfExists?: boolean;
  /** Обновить шаги из JSON поверх существующей программы */
  force?: boolean;
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

async function upsertLevelWithSteps(
  prisma: PrismaClient,
  number: number,
  title: string,
  steps: StepDef[],
) {
  let level = await prisma.level.findUnique({ where: { number } });

  if (!level) {
    return createLevelWithSteps(prisma, number, title, steps);
  }

  await prisma.level.update({
    where: { id: level.id },
    data: { title },
  });

  const jsonOrders = steps.map((step) => step.order);

  for (const step of steps) {
    await prisma.step.upsert({
      where: {
        levelId_order: { levelId: level.id, order: step.order },
      },
      create: {
        levelId: level.id,
        order: step.order,
        title: step.title,
        content: buildContent(step),
        hours: step.hours,
      },
      update: {
        title: step.title,
        content: buildContent(step),
        hours: step.hours,
      },
    });
  }

  const orphanSteps = await prisma.step.findMany({
    where: {
      levelId: level.id,
      order: { notIn: jsonOrders },
    },
    select: { id: true },
  });

  if (orphanSteps.length > 0) {
    const orphanIds = orphanSteps.map((step) => step.id);
    await prisma.stepCompletion.deleteMany({
      where: { stepId: { in: orphanIds } },
    });
    await prisma.step.deleteMany({
      where: { id: { in: orphanIds } },
    });
  }

  return level;
}

async function resyncProgram(
  prisma: PrismaClient,
  levelStepDefs: StepDef[][],
) {
  for (const [index, steps] of levelStepDefs.entries()) {
    await upsertLevelWithSteps(
      prisma,
      index + 1,
      LEVEL_TITLES[index]!,
      steps,
    );
  }
}

/** Загружает программу обучения (5 уровней) из prisma/data в БД. */
export async function seedProgram(
  prisma: PrismaClient,
  options: SeedProgramOptions = {},
): Promise<SeedProgramResult> {
  const { skipIfExists = false, force = false } = options;
  const levelStepDefs = loadAllProgramLevelSteps();
  const levelStepCounts = levelStepDefs.map((steps) => steps.length);

  const existingLevels = await prisma.level.count();
  if (existingLevels > 0) {
    if (force) {
      await resyncProgram(prisma, levelStepDefs);
      return { skipped: false, resynced: true, levelStepCounts };
    }

    if (skipIfExists) {
      return { skipped: true, resynced: false, levelStepCounts };
    }

    throw new Error(
      "Программа уже загружена. Используйте pnpm db:seed:program -- --force или полный demo-seed.",
    );
  }

  await Promise.all(
    levelStepDefs.map((steps, index) =>
      createLevelWithSteps(prisma, index + 1, LEVEL_TITLES[index]!, steps),
    ),
  );

  return { skipped: false, resynced: false, levelStepCounts };
}

export function formatProgramSeedSummary(result: SeedProgramResult): string {
  const counts = result.levelStepCounts
    .map((count, index) => `${index + 1}=${count}`)
    .join(", ");

  if (result.skipped) {
    return `Программа уже существует (уровни 1–5: ${counts} шагов)`;
  }

  if (result.resynced) {
    return `Программа пересоздана из JSON: уровни 1–5 — ${counts} шагов`;
  }

  return `Программа загружена: уровни 1–5 — ${counts} шагов`;
}
