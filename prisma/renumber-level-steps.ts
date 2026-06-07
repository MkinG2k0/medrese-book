import "dotenv/config";

import { PrismaClient } from "../src/shared/lib/db";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function getGlobalOrderOffset(levelNumber: number) {
  return prisma.step.count({
    where: { level: { number: { lt: levelNumber } } },
  });
}

async function renumberLevelSteps(levelNumber: number) {
  const level = await prisma.level.findUnique({
    where: { number: levelNumber },
    include: { steps: { orderBy: { order: "asc" } } },
  });

  if (!level || level.steps.length === 0) {
    console.log(`Уровень ${levelNumber}: шагов нет, пропуск`);
    return;
  }

  const offset = await getGlobalOrderOffset(levelNumber);
  const firstExpected = offset + 1;
  const alreadyCorrect = level.steps.every(
    (step, index) => step.order === firstExpected + index,
  );

  if (alreadyCorrect) {
    console.log(
      `Уровень ${levelNumber}: нумерация уже корректна (${firstExpected}–${firstExpected + level.steps.length - 1})`,
    );
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const step of level.steps) {
      await tx.step.update({
        where: { id: step.id },
        data: { order: step.order + 10000 },
      });
    }

    for (const [index, step] of level.steps.entries()) {
      await tx.step.update({
        where: { id: step.id },
        data: { order: firstExpected + index },
      });
    }

    const students = await tx.student.findMany({
      where: { levelId: level.id },
    });

    for (const student of students) {
      if (student.currentStepIdx < offset) {
        await tx.student.update({
          where: { id: student.id },
          data: { currentStepIdx: offset },
        });
      }
    }
  });

  console.log(
    `Уровень ${levelNumber}: шаги перенумерованы ${firstExpected}–${firstExpected + level.steps.length - 1}`,
  );
}

async function main() {
  const levels = await prisma.level.findMany({
    orderBy: { number: "asc" },
    select: { number: true },
  });

  for (const level of levels) {
    // Каждая глава хранит локальную нумерацию 1–33 из DOCX.
    if (level.number <= 2) continue;
    await renumberLevelSteps(level.number);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
