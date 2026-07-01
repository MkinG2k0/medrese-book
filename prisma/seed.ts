import "dotenv/config";

import { PrismaClient } from "../src/shared/lib/db";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  LEVEL1_TITLE,
  LEVEL2_TITLE,
} from "./lib/parse-level1-docx";
import {
  buildContent,
  loadAllLevel1Steps,
  type StepDef,
} from "./lib/level1-import-utils";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function createLevelWithSteps(
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

const PASSING_GRADE = 3;

async function seedStudentCompletions(
  studentId: string,
  passedStepIds: string[],
) {
  if (passedStepIds.length === 0) return;

  const session = await prisma.session.create({
    data: {
      studentId,
      date: new Date(),
      attendance: "PRESENT",
      note: "Seed data",
    },
  });

  await prisma.stepCompletion.createMany({
    data: passedStepIds.map((stepId) => ({
      studentId,
      stepId,
      sessionId: session.id,
      grade: PASSING_GRADE,
    })),
  });
}

function getPassedStepIds(
  currentStepIdx: number,
  level1Steps: { id: string }[],
  level2Steps: { id: string }[],
  level2StepOffset: number,
  onLevel1: boolean,
): string[] {
  if (onLevel1) {
    return level1Steps.slice(0, currentStepIdx).map((step) => step.id);
  }

  const localStepIndex = currentStepIdx - level2StepOffset;
  return [
    ...level1Steps.map((step) => step.id),
    ...level2Steps.slice(0, localStepIndex).map((step) => step.id),
  ];
}

async function main() {
  const level1Steps = loadAllLevel1Steps();

  await prisma.stepCompletion.deleteMany();
  await prisma.session.deleteMany();
  await prisma.award.deleteMany();
  await prisma.step.deleteMany();
  await prisma.student.deleteMany();
  await prisma.group.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.user.deleteMany();
  await prisma.level.deleteMany();

  const superAdmin = await prisma.user.create({
    data: { name: "Супер-админ", code: "100001", role: "SUPER_ADMIN" },
  });

  const manager = await prisma.user.create({
    data: { name: "Менеджер", code: "100002", role: "MANAGER" },
  });

  const teacher1User = await prisma.user.create({
    data: { name: "Учитель Ахмад", code: "200001", role: "TEACHER" },
  });
  const teacher2User = await prisma.user.create({
    data: { name: "Учитель Ибрагим", code: "200002", role: "TEACHER" },
  });

  const teacher1 = await prisma.teacher.create({
    data: { userId: teacher1User.id },
  });
  const teacher2 = await prisma.teacher.create({
    data: { userId: teacher2User.id },
  });

  const level1 = await createLevelWithSteps(1, LEVEL1_TITLE, level1Steps);
  const level2 = await createLevelWithSteps(2, LEVEL2_TITLE, level1Steps);

  const [level1StepIds, level2StepIds] = await Promise.all([
    prisma.step.findMany({
      where: { levelId: level1.id },
      orderBy: { order: "asc" },
      select: { id: true },
    }),
    prisma.step.findMany({
      where: { levelId: level2.id },
      orderBy: { order: "asc" },
      select: { id: true },
    }),
  ]);

  const group1 = await prisma.group.create({
    data: {
      name: "Группа Аль-Фатиха",
      teacherId: teacher1.id,
    },
  });

  const group2 = await prisma.group.create({
    data: {
      name: "Группа Ан-Нас",
      teacherId: teacher2.id,
    },
  });

  const studentNames = ["Али", "Усман", "Билал", "Халид", "Зайд"];
  const studentCodes = ["300001", "300002", "300003", "300004", "300005"];
  const level2StepOffset = level1Steps.length;

  for (let i = 0; i < studentNames.length; i++) {
    const onLevel1 = i < 3;
    const currentStepIdx = onLevel1 ? i : level2StepOffset + (i - 3);
    const user = await prisma.user.create({
      data: {
        name: studentNames[i]!,
        code: studentCodes[i]!,
        role: "STUDENT",
      },
    });
    const student = await prisma.student.create({
      data: {
        userId: user.id,
        groupId: onLevel1 ? group1.id : group2.id,
        levelId: onLevel1 ? level1.id : level2.id,
        currentStepIdx,
      },
    });

    await seedStudentCompletions(
      student.id,
      getPassedStepIds(
        currentStepIdx,
        level1StepIds,
        level2StepIds,
        level2StepOffset,
        onLevel1,
      ),
    );
  }

  console.log("Seed completed:");
  console.log(
    `  Глава 1 и 2: по ${level1Steps.length} шагов (${level1Steps.reduce((sum, step) => sum + step.hours, 0)}ч.) из prisma/data`,
  );
  console.log(`  SUPER_ADMIN: ${superAdmin.code}`);
  console.log(`  MANAGER: ${manager.code}`);
  console.log(`  TEACHER 1: ${teacher1User.code}`);
  console.log(`  TEACHER 2: ${teacher2User.code}`);
  console.log(`  STUDENTS: ${studentCodes.join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
