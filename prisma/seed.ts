import "dotenv/config";

import { PrismaClient } from "../src/shared/lib/db";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedProgram } from "./lib/seed-program";
import {
  buildLessonDates,
  buildLevelStepOffsets,
  createSeedContext,
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

async function main() {
  const seedCtx = createSeedContext();
  const lessonDates = buildLessonDates(seedCtx);

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

  const programResult = await seedProgram(prisma);
  const levels = await prisma.level.findMany({
    orderBy: { number: "asc" },
  });

  const levelStepIds = await Promise.all(
    levels.map((level) =>
      prisma.step.findMany({
        where: { levelId: level.id },
        orderBy: { order: "asc" },
        select: { id: true },
      }),
    ),
  );

  const levelStepCounts = programResult.levelStepCounts;
  const levelStepOffsets = buildLevelStepOffsets(levelStepCounts);

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
        currentStepIdx: getCurrentStepIdx(profile, levelStepOffsets),
        status: profile.status ?? "ACTIVE",
      },
    });

    const passedIds = getPassedStepIds(profile, levelStepIds).map((step) => step.id);

    await seedStudentHistory(prisma, student.id, profile, passedIds, lessonDates, seedCtx);
  }

  const studentCodes = STUDENT_PROFILES.map((p) => p.code);
  const periodLabel = `${seedCtx.periodStart.toISOString().slice(0, 10)} — ${seedCtx.periodEnd.toISOString().slice(0, 10)}`;

  console.log("Seed completed:");
  console.log(
    `  Уровни 1–5: ${levelStepCounts.map((count, index) => `${index + 1}=${count}`).join(", ")} шагов`,
  );
  console.log(`  Учеников: ${STUDENT_PROFILES.length}`);
  console.log(`  Период данных: ${periodLabel}`);
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
