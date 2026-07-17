import type { PrismaClient } from "../../src/shared/lib/db";

import {
  LEVEL1_TITLE,
  LEVEL2_TITLE,
  LEVEL3_TITLE,
  LEVEL4_TITLE,
  LEVEL5_TITLE,
} from "./program-config";
import {
  loadAllProgramLevelSteps,
  resolveStepContent,
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
  subjectId: string;
  /** Пропустить загрузку, если уровни уже есть в БД для этого предмета */
  skipIfExists?: boolean;
  /** Обновить шаги из JSON поверх существующей программы */
  force?: boolean;
};

export type SeedMiniProgramOptions = {
  subjectId: string;
  levels: number;
  stepsPerLevel: number;
  titles?: string[];
};

function buildMiniStepDefs(
  levelNumber: number,
  stepsPerLevel: number,
  subjectLabel: string,
): StepDef[] {
  return Array.from({ length: stepsPerLevel }, (_, index) => {
    const order = index + 1;
    return {
      order,
      title: `${subjectLabel}: уровень ${levelNumber}, шаг ${order}`,
      lesson: `${order}`,
      letters: "",
      task: `Демо-задание ${order} (уровень ${levelNumber})`,
      hours: 1,
    };
  });
}

async function createLevelWithSteps(
  prisma: PrismaClient,
  subjectId: string,
  number: number,
  title: string,
  steps: StepDef[],
) {
  const level = await prisma.level.create({
    data: { subjectId, number, title },
  });

  for (const step of steps) {
    await prisma.step.create({
      data: {
        levelId: level.id,
        order: step.order,
        title: step.title,
        content: resolveStepContent(step),
        teacherNote: { blocks: [] },
        pdfUrl: step.pdfUrl ?? null,
        hours: step.hours,
      },
    });
  }

  return level;
}

async function upsertLevelWithSteps(
  prisma: PrismaClient,
  subjectId: string,
  number: number,
  title: string,
  steps: StepDef[],
) {
  let level = await prisma.level.findFirst({
    where: { subjectId, number },
  });

  if (!level) {
    return createLevelWithSteps(prisma, subjectId, number, title, steps);
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
        content: resolveStepContent(step),
        teacherNote: { blocks: [] },
        pdfUrl: step.pdfUrl ?? null,
        hours: step.hours,
      },
      update: {
        title: step.title,
        content: resolveStepContent(step),
        teacherNote: { blocks: [] },
        pdfUrl: step.pdfUrl ?? null,
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
  subjectId: string,
  levelStepDefs: StepDef[][],
) {
  for (const [index, steps] of levelStepDefs.entries()) {
    await upsertLevelWithSteps(
      prisma,
      subjectId,
      index + 1,
      LEVEL_TITLES[index]!,
      steps,
    );
  }
}

/** Загружает компактную демо-программу (несколько уровней с простыми шагами). */
export async function seedMiniProgram(
  prisma: PrismaClient,
  options: SeedMiniProgramOptions,
): Promise<SeedProgramResult> {
  const { subjectId, levels, stepsPerLevel, titles } = options;
  const levelStepCounts: number[] = [];

  for (let levelNumber = 1; levelNumber <= levels; levelNumber += 1) {
    const title =
      titles?.[levelNumber - 1] ?? `Уровень ${levelNumber}`;
    const steps = buildMiniStepDefs(levelNumber, stepsPerLevel, title);
    await createLevelWithSteps(
      prisma,
      subjectId,
      levelNumber,
      title,
      steps,
    );
    levelStepCounts.push(steps.length);
  }

  return { skipped: false, resynced: false, levelStepCounts };
}

/** Загружает полную программу обучения (5 уровней) из prisma/data в БД. */
export async function seedProgram(
  prisma: PrismaClient,
  options: SeedProgramOptions,
): Promise<SeedProgramResult> {
  const { subjectId, skipIfExists = false, force = false } = options;
  const levelStepDefs = loadAllProgramLevelSteps();
  const levelStepCounts = levelStepDefs.map((steps) => steps.length);

  const existingLevels = await prisma.level.count({
    where: { subjectId },
  });
  if (existingLevels > 0) {
    if (force) {
      await resyncProgram(prisma, subjectId, levelStepDefs);
      return { skipped: false, resynced: true, levelStepCounts };
    }

    if (skipIfExists) {
      return { skipped: true, resynced: false, levelStepCounts };
    }

    throw new Error(
      "Программа уже загружена для этого предмета. Используйте pnpm db:seed:program -- --force или полный demo-seed.",
    );
  }

  await Promise.all(
    levelStepDefs.map((steps, index) =>
      createLevelWithSteps(
        prisma,
        subjectId,
        index + 1,
        LEVEL_TITLES[index]!,
        steps,
      ),
    ),
  );

  return { skipped: false, resynced: false, levelStepCounts };
}

export function formatProgramSeedSummary(result: SeedProgramResult): string {
  const counts = result.levelStepCounts
    .map((count, index) => `${index + 1}=${count}`)
    .join(", ");

  if (result.skipped) {
    return `Программа уже существует (уровни 1–${result.levelStepCounts.length}: ${counts} шагов)`;
  }

  if (result.resynced) {
    return `Программа пересоздана из JSON: уровни 1–${result.levelStepCounts.length} — ${counts} шагов`;
  }

  return `Программа загружена: уровни 1–${result.levelStepCounts.length} — ${counts} шагов`;
}
