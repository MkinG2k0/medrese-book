import "dotenv/config";

import { PrismaClient } from "../src/shared/lib/db";
import { PrismaPg } from "@prisma/adapter-pg";
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
    include: { steps: { orderBy: { order: "asc" } } },
  });

  if (!level) {
    throw new Error("Уровень 1 не найден в базе данных");
  }

  const page2Steps = loadLevel1PageSteps(2);
  const page3Steps = loadLevel1PageSteps(3);
  const newSteps = [...page2Steps, ...page3Steps];
  const ordersToReplace = newSteps.map((step) => step.order);

  const stepsToDelete = level.steps.filter((step) =>
    ordersToReplace.includes(step.order),
  );
  const deleteIds = stepsToDelete.map((step) => step.id);

  await prisma.$transaction(async (tx) => {
    if (deleteIds.length > 0) {
      await tx.stepCompletion.deleteMany({
        where: { stepId: { in: deleteIds } },
      });
      await tx.step.deleteMany({ where: { id: { in: deleteIds } } });
    }

    for (const step of newSteps) {
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
  });

  const totalSteps = level.steps.length - deleteIds.length + newSteps.length;
  console.log(
    `Уровень 1 дополнен: страница 2 (${page2Steps.length} шагов), страница 3 (${page3Steps.length} шагов). Всего шагов: ${totalSteps}`,
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
