import "dotenv/config";

import { assertDestructiveSeedAllowed } from "./lib/seed-guard";

assertDestructiveSeedAllowed("demo-seed");

import { PrismaClient } from "../src/shared/lib/db";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  formatProgramSeedSummary,
  seedMiniProgram,
  seedProgram,
} from "./lib/seed-program";
import { DEFAULT_QURAN_SUBJECT_ID } from "./lib/subject-constants";
import {
  buildLessonDates,
  buildLevelStepOffsets,
  buildStudentContactData,
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
  await prisma.salaryPayout.deleteMany();
  await prisma.salaryAccrual.deleteMany();
  await prisma.teachingSessionDurationAdjustment.deleteMany();
  await prisma.teacherRate.deleteMany();
  await prisma.tuitionPayment.deleteMany();
  await prisma.tuitionCharge.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.monthClose.deleteMany();
  await prisma.stepCompletion.deleteMany();
  await prisma.extraAssignmentCompletion.deleteMany();
  await prisma.studentExtraAssignment.deleteMany();
  await prisma.extraAssignment.deleteMany();
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
  await prisma.subject.deleteMany();

  const superAdmin = await prisma.user.create({
    data: { name: "Супер-админ", code: "100001", role: "SUPER_ADMIN" },
  });

  const manager = await prisma.user.create({
    data: { name: "Менеджер", code: "100002", role: "MANAGER" },
  });

  const accountant = await prisma.user.create({
    data: { name: "Бухгалтер", code: "400001", role: "ACCOUNTANT" },
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

  const quranSubject = await prisma.subject.create({
    data: {
      id: DEFAULT_QURAN_SUBJECT_ID,
      name: "Коран",
      description: "Полная программа изучения Корана",
    },
  });

  const tajweedSubject = await prisma.subject.create({
    data: {
      name: "Таджвид",
      description: "Правила чтения",
    },
  });

  const arabicSubject = await prisma.subject.create({
    data: {
      name: "Арабский язык",
      description: "Базовый курс",
    },
  });

  const quranProgramResult = await seedProgram(prisma, {
    subjectId: quranSubject.id,
  });

  const tajweedProgramResult = await seedMiniProgram(prisma, {
    subjectId: tajweedSubject.id,
    levels: 2,
    stepsPerLevel: 3,
    titles: ["Таджвид — основы", "Таджвид — практика"],
  });

  const arabicProgramResult = await seedMiniProgram(prisma, {
    subjectId: arabicSubject.id,
    levels: 3,
    stepsPerLevel: 5,
    titles: [
      "Арабский — алфавит",
      "Арабский — слова",
      "Арабский — чтение",
    ],
  });

  const quranLevels = await prisma.level.findMany({
    where: { subjectId: quranSubject.id },
    orderBy: { number: "asc" },
  });

  const levelStepIds = await Promise.all(
    quranLevels.map((level) =>
      prisma.step.findMany({
        where: { levelId: level.id },
        orderBy: { order: "asc" },
        select: { id: true },
      }),
    ),
  );

  const levelStepCounts = quranProgramResult.levelStepCounts;
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

  for (const [index, profile] of STUDENT_PROFILES.entries()) {
    const user = await prisma.user.create({
      data: {
        name: profile.name,
        code: profile.code,
        role: "STUDENT",
      },
    });

    const contacts = buildStudentContactData(profile, index);

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        fullName: contacts.fullName,
        phone: contacts.phone,
        guardianName: contacts.guardianName,
        guardianPhone: contacts.guardianPhone,
        groupId: groups[profile.groupIndex]!.id,
        levelId: quranLevels[profile.level - 1]!.id,
        currentStepIdx: getCurrentStepIdx(profile, levelStepOffsets),
        status: profile.status ?? "ACTIVE",
      },
    });

    const passedIds = getPassedStepIds(profile, levelStepIds).map((step) => step.id);

    await seedStudentHistory(prisma, student.id, profile, passedIds, lessonDates, seedCtx);
  }

  const firstLevelSteps = await prisma.step.findMany({
    where: { levelId: quranLevels[0]!.id },
    orderBy: { order: "asc" },
    take: 2,
  });
  const firstStep = firstLevelSteps[0];
  const secondStep = firstLevelSteps[1];

  if (firstStep) {
    await prisma.extraAssignment.createMany({
      data: [
        {
          title: "E2E Extra: Повторение суры Аль-Фатиха",
          content: {
            blocks: [{ type: "text", value: "Прочитать суру Аль-Фатиха 3 раза" }],
          },
          stepId: firstStep.id,
          authorId: manager.id,
          isSystem: true,
        },
        {
          title: "E2E Extra: Письменное задание",
          content: {
            blocks: [{ type: "text", value: "Выписать аят из памяти" }],
          },
          stepId: secondStep?.id ?? firstStep.id,
          authorId: superAdmin.id,
          isSystem: true,
        },
        {
          title: "E2E Extra: Учительское задание",
          content: {
            blocks: [{ type: "text", value: "Дополнительная практика чтения" }],
          },
          stepId: firstStep.id,
          authorId: teacher1User.id,
          isSystem: false,
        },
      ],
    });
  }

  const studentCodes = STUDENT_PROFILES.map((p) => p.code);
  const periodLabel = `${seedCtx.periodStart.toISOString().slice(0, 10)} — ${seedCtx.periodEnd.toISOString().slice(0, 10)}`;

  const formatSubjectSummary = (
    name: string,
    result: { levelStepCounts: number[] },
  ) => {
    const counts = result.levelStepCounts
      .map((count, index) => `${index + 1}=${count}`)
      .join(", ");
    return `  ${name}: ${result.levelStepCounts.length} уровней (${counts} шагов)`;
  };

  console.log("Seed completed:");
  console.log("Предметы:");
  console.log(formatSubjectSummary("Коран", quranProgramResult));
  console.log(formatSubjectSummary("Таджвид", tajweedProgramResult));
  console.log(formatSubjectSummary("Арабский язык", arabicProgramResult));
  console.log(formatProgramSeedSummary(quranProgramResult));
  console.log(`  Учеников: ${STUDENT_PROFILES.length} (уровни программы Корана)`);
  console.log(`  Период данных: ${periodLabel}`);
  console.log(`  Занятий групп (вт/чт): ${lessonDates.length} дат на группу`);
  console.log(`  SUPER_ADMIN: ${superAdmin.code}`);
  console.log(`  MANAGER: ${manager.code}`);
  console.log(`  ACCOUNTANT: ${accountant.code}`);
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
