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
import {
  buildLessonDates,
  getCurrentStepIdx,
  getPassedStepIds,
  seedStudentHistory,
  seedTeachingSessions,
  STUDENT_PROFILES,
} from "./lib/seed-history";

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

async function main() {
  const level1Steps = loadAllLevel1Steps();
  const lessonDates = buildLessonDates();

  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.pushSubscription.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.stepCompletion.deleteMany();
  await prisma.session.deleteMany();
  await prisma.award.deleteMany();
  await prisma.teachingSession.deleteMany();
  await prisma.leaveRequest.updateMany({ data: { substitutionId: null } });
  await prisma.substitution.deleteMany();
  await prisma.leaveRequest.deleteMany();
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

  const groups = [group1, group2];
  const teachers = [teacher1, teacher2];
  const levels = [level1, level2];
  const level2StepOffset = level1Steps.length;

  await seedTeachingSessions(prisma, group1.id, teacher1.id, lessonDates);
  await seedTeachingSessions(prisma, group2.id, teacher2.id, lessonDates);

  for (const profile of STUDENT_PROFILES) {
    const user = await prisma.user.create({
      data: {
        name: profile.name,
        code: profile.code,
        role: "STUDENT",
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        groupId: groups[profile.groupIndex]!.id,
        levelId: levels[profile.level - 1]!.id,
        currentStepIdx: getCurrentStepIdx(profile, level2StepOffset),
        status: profile.status ?? "ACTIVE",
      },
    });

    const passedIds = getPassedStepIds(
      profile,
      level1StepIds,
      level2StepIds,
      level2StepOffset,
    ).map((step) => step.id);

    await seedStudentHistory(prisma, student.id, profile, passedIds, lessonDates);
  }

  const studentCodes = STUDENT_PROFILES.map((p) => p.code);

  console.log("Seed completed:");
  console.log(
    `  Глава 1 и 2: по ${level1Steps.length} шагов (${level1Steps.reduce((sum, step) => sum + step.hours, 0)}ч.) из prisma/data`,
  );
  console.log(`  Учеников: ${STUDENT_PROFILES.length}`);
  console.log(`  Занятий групп (вт/чт): ${lessonDates.length} дат на группу`);
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
