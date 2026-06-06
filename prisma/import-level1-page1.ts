import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PrismaClient } from "../src/shared/lib/db";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

type StepDef = {
  order: number;
  title: string;
  lesson: string;
  letters: string;
  task: string;
  hours: number;
};

const LEVEL1_PAGE1_STEPS: StepDef[] = JSON.parse(
  readFileSync(join(process.cwd(), "prisma/data/level1-page1.json"), "utf8"),
);

function hasArabic(text: string) {
  return /[\u0600-\u06FF]/.test(text);
}

function buildContent(step: StepDef) {
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

async function main() {
  const level = await prisma.level.findUnique({
    where: { number: 1 },
    include: { steps: true },
  });

  if (!level) {
    throw new Error("Уровень 1 не найден в базе данных");
  }

  const oldStepIds = level.steps.map((step) => step.id);

  await prisma.$transaction(async (tx) => {
    if (oldStepIds.length > 0) {
      await tx.stepCompletion.deleteMany({
        where: { stepId: { in: oldStepIds } },
      });
      await tx.step.deleteMany({ where: { levelId: level.id } });
    }

    for (const step of LEVEL1_PAGE1_STEPS) {
      await tx.step.create({
        data: {
          levelId: level.id,
          order: step.order,
          title: step.title,
          content: buildContent(step),
          hours: step.hours,
        },
      });
    }

    await tx.level.update({
      where: { id: level.id },
      data: { title: "1й уровень — Буквы и слова (48ч.)" },
    });

    const level1Students = await tx.student.findMany({
      where: { levelId: level.id },
    });

    for (const student of level1Students) {
      const cappedIdx = Math.min(
        student.currentStepIdx,
        LEVEL1_PAGE1_STEPS.length,
      );
      if (cappedIdx !== student.currentStepIdx) {
        await tx.student.update({
          where: { id: student.id },
          data: { currentStepIdx: cappedIdx },
        });
      }
    }
  });

  console.log(
    `Уровень 1 обновлён: удалено ${oldStepIds.length} шагов, добавлено ${LEVEL1_PAGE1_STEPS.length} шагов (1-я страница, 48ч.)`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
