import "dotenv/config";

import { PrismaClient } from "../src/shared/lib/db";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const defaultStepContent = (title: string) => ({
  blocks: [
    { type: "text", value: `Урок: ${title}` },
    { type: "arabic", value: "بِسْمِ اللَّهِ", size: "lg" },
  ],
});

async function main() {
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

  const level1 = await prisma.level.create({
    data: { number: 1, title: "Уровень 1 — Буквы" },
  });
  const level2 = await prisma.level.create({
    data: { number: 2, title: "Уровень 2 — Суры" },
  });

  for (let i = 1; i <= 5; i++) {
    await prisma.step.create({
      data: {
        levelId: level1.id,
        order: i,
        title: `Буква ${i}`,
        content: defaultStepContent(`Буква ${i}`),
        hours: 1,
      },
    });
  }

  for (let i = 1; i <= 5; i++) {
    await prisma.step.create({
      data: {
        levelId: level2.id,
        order: i + 5,
        title: `Сура ${i}`,
        content: defaultStepContent(`Сура ${i}`),
        hours: 2,
      },
    });
  }

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

  for (let i = 0; i < studentNames.length; i++) {
    const user = await prisma.user.create({
      data: {
        name: studentNames[i]!,
        code: studentCodes[i]!,
        role: "STUDENT",
      },
    });
    await prisma.student.create({
      data: {
        userId: user.id,
        groupId: i < 3 ? group1.id : group2.id,
        levelId: i < 3 ? level1.id : level2.id,
        currentStepIdx: i < 3 ? i : 5 + (i - 3),
      },
    });
  }

  console.log("Seed completed:");
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
