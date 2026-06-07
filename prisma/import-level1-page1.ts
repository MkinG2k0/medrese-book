import "dotenv/config";

import { PrismaClient } from "../src/shared/lib/db";
import { PrismaPg } from "@prisma/adapter-pg";
import { LEVEL1_TITLE } from "./lib/parse-level1-docx";
import {
  buildContent,
  loadLevel1PageSteps,
} from "./lib/level1-import-utils";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const level = await prisma.level.findUnique({
    where: { number: 1 },
    include: { steps: true },
  });

  if (!level) {
    throw new Error("Уровень 1 не найден в базе данных");
  }

  const page1Steps = loadLevel1PageSteps(1);
  const page1Orders = new Set(page1Steps.map((step) => step.order));
  const oldStepIds = level.steps
    .filter((step) => page1Orders.has(step.order))
    .map((step) => step.id);

  await prisma.$transaction(async (tx) => {
    if (oldStepIds.length > 0) {
      await tx.stepCompletion.deleteMany({
        where: { stepId: { in: oldStepIds } },
      });
      await tx.step.deleteMany({ where: { id: { in: oldStepIds } } });
    }

    for (const step of page1Steps) {
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
      data: { title: LEVEL1_TITLE },
    });

    const level1Students = await tx.student.findMany({
      where: { levelId: level.id },
    });

    const maxOrder = Math.max(...page1Steps.map((step) => step.order));
    for (const student of level1Students) {
      if (student.currentStepIdx > maxOrder) {
        await tx.student.update({
          where: { id: student.id },
          data: { currentStepIdx: maxOrder },
        });
      }
    }
  });

  console.log(
    `Уровень 1 обновлён: заменено ${oldStepIds.length} шагов, добавлено ${page1Steps.length} шагов (1-я страница, 48ч.)`,
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
