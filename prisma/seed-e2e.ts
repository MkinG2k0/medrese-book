import "dotenv/config";

import { assertDestructiveSeedAllowed } from "./lib/seed-guard";

assertDestructiveSeedAllowed("e2e-seed");

import { PrismaClient } from "../src/shared/lib/db";
import { PrismaPg } from "@prisma/adapter-pg";
import { buildStudentContactData, E2E_PARENT_PROFILES, seedParentUsers } from "./lib/seed-history";
import { DEFAULT_QURAN_SUBJECT_ID } from "./lib/subject-constants";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const PASSING_GRADE = 3;
const CURRICULUM_HINT =
  "Сначала выполните pnpm db:seed (или pnpm db:seed:program для Корана). db:seed:e2e не создаёт и не удаляет программу, предметы, уровни и шаги.";

async function loadSubjectCurriculum(
  where: { id: string } | { name: string },
  label: string,
  minLevels: number,
) {
  const subject = await prisma.subject.findFirst({
    where,
    include: {
      levels: {
        orderBy: { number: "asc" },
        include: {
          steps: { orderBy: { order: "asc" }, select: { id: true } },
        },
      },
    },
  });

  if (!subject) {
    throw new Error(`${label} не найден. ${CURRICULUM_HINT}`);
  }

  const levels = subject.levels.filter((level) => level.steps.length > 0);
  if (levels.length < minLevels) {
    throw new Error(
      `У предмета «${subject.name}» недостаточно уровней с шагами (нужно ≥ ${minLevels}). ${CURRICULUM_HINT}`,
    );
  }

  return { subject, levels };
}

async function seedStudentCompletions(
  studentId: string,
  groupId: string,
  passedStepIds: string[],
) {
  if (passedStepIds.length === 0) return;

  const session = await prisma.session.create({
    data: {
      studentId,
      groupId,
      date: new Date(),
      attendance: "PRESENT",
      note: "E2E seed",
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
  const quran = await loadSubjectCurriculum(
    { id: DEFAULT_QURAN_SUBJECT_ID },
    "Предмет «Коран»",
    2,
  );
  const tajweed = await loadSubjectCurriculum(
    { name: "Таджвид" },
    "Предмет «Таджвид»",
    1,
  );

  const level1 = quran.levels[0]!;
  const level2 = quran.levels[1]!;
  const level1Steps = level1.steps;
  const level2Steps = level2.steps;
  if (level1Steps.length < 3 || level2Steps.length < 1) {
    throw new Error(
      "Для e2e у Корана нужно ≥ 3 шагов на 1-м уровне и ≥ 1 шаг на 2-м. " +
        CURRICULUM_HINT,
    );
  }
  const tajweedLevel = tajweed.levels[0]!;
  const tajweedSteps = tajweedLevel.steps;
  const level2StepOffset = level1Steps.length;

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
  await prisma.groupEnrollment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.group.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.user.deleteMany();

  const superAdmin = await prisma.user.create({
    data: {
      name: "Супер-админ",
      code: "100001",
      role: "SUPER_ADMIN",
      phone: "89681000001",
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: "Менеджер",
      code: "100002",
      role: "MANAGER",
      phone: "89681000002",
    },
  });

  const accountant = await prisma.user.create({
    data: {
      name: "Бухгалтер",
      code: "400001",
      role: "ACCOUNTANT",
      phone: "89684000001",
    },
  });

  const teacher1User = await prisma.user.create({
    data: {
      name: "Учитель Ахмад",
      code: "200001",
      role: "TEACHER",
      phone: "89682000001",
    },
  });
  const teacher2User = await prisma.user.create({
    data: {
      name: "Учитель Ибрагим",
      code: "200002",
      role: "TEACHER",
      phone: "89682000002",
    },
  });

  const teacher1 = await prisma.teacher.create({
    data: { userId: teacher1User.id },
  });
  const teacher2 = await prisma.teacher.create({
    data: { userId: teacher2User.id },
  });

  const group1 = await prisma.group.create({
    data: {
      name: "Группа Аль-Фатиха",
      subjectId: quran.subject.id,
      teacherId: teacher1.id,
    },
  });

  const teacher1Group2 = await prisma.group.create({
    data: {
      name: "Группа Аль-Ихлас",
      subjectId: quran.subject.id,
      teacherId: teacher1.id,
    },
  });

  const group2 = await prisma.group.create({
    data: {
      name: "Группа Ан-Нас",
      subjectId: quran.subject.id,
      teacherId: teacher2.id,
    },
  });

  const tajweedGroup = await prisma.group.create({
    data: {
      name: "Группа Таджвид",
      subjectId: tajweed.subject.id,
      teacherId: teacher1.id,
    },
  });

  const parentsByCode = await seedParentUsers(prisma, E2E_PARENT_PROFILES);

  const e2eStudents = [
    { name: "Али", code: "300001", parentCode: "500001" },
    { name: "Усман", code: "300002", parentCode: "500001" },
    { name: "Билал", code: "300003", parentCode: "500002" },
    { name: "Халид", code: "300004", parentCode: "500003" },
    { name: "Зайд", code: "300005", parentCode: "500003" },
  ] as const;
  const studentsByName = new Map<
    string,
    { id: string; onLevel1: boolean; currentStepIdx: number }
  >();

  for (let i = 0; i < e2eStudents.length; i++) {
    const profile = e2eStudents[i]!;
    const onLevel1 = i < 3;
    const currentStepIdx = onLevel1 ? i : level2StepOffset + (i - 3);
    const user = await prisma.user.create({
      data: {
        name: profile.name,
        code: profile.code,
        role: "STUDENT",
      },
    });
    const contacts = buildStudentContactData(
      { name: profile.name, code: profile.code },
      i,
    );
    const parent = parentsByCode.get(profile.parentCode);
    if (!parent) {
      throw new Error(`Опекун ${profile.parentCode} не найден для ${profile.name}`);
    }
    const enrollmentGroupId = onLevel1 ? group1.id : group2.id;

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        fullName: contacts.fullName,
        phone: contacts.phone,
        guardianName: parent.name,
        guardianPhone: parent.phone,
        parentId: parent.id,
      },
    });

    await prisma.groupEnrollment.create({
      data: {
        studentId: student.id,
        groupId: enrollmentGroupId,
        levelId: onLevel1 ? level1.id : level2.id,
        currentStepIdx,
      },
    });

    await seedStudentCompletions(
      student.id,
      enrollmentGroupId,
      getPassedStepIds(
        currentStepIdx,
        level1Steps,
        level2Steps,
        level2StepOffset,
        onLevel1,
      ),
    );

    studentsByName.set(profile.name, {
      id: student.id,
      onLevel1,
      currentStepIdx,
    });
  }

  for (const studentName of ["Халид", "Зайд"] as const) {
    const entry = studentsByName.get(studentName);
    if (!entry) continue;

    await prisma.groupEnrollment.create({
      data: {
        studentId: entry.id,
        groupId: teacher1Group2.id,
        levelId: entry.onLevel1 ? level1.id : level2.id,
        currentStepIdx: entry.currentStepIdx,
      },
    });
  }

  const aliEntry = studentsByName.get("Али");
  const firstQuranStep = level1Steps[0];
  const secondQuranStep = level1Steps[1] ?? firstQuranStep;
  const firstTajweedStep = tajweedSteps[0];

  if (aliEntry && firstQuranStep && firstTajweedStep) {
    await prisma.groupEnrollment.create({
      data: {
        studentId: aliEntry.id,
        groupId: tajweedGroup.id,
        levelId: tajweedLevel.id,
        currentStepIdx: 0,
      },
    });

    const quranSession =
      (await prisma.session.findFirst({
        where: { studentId: aliEntry.id, groupId: group1.id },
      })) ??
      (await prisma.session.create({
        data: {
          studentId: aliEntry.id,
          groupId: group1.id,
          date: new Date(),
          attendance: "PRESENT",
          note: "E2E seed",
        },
      }));

    const tajweedSession = await prisma.session.create({
      data: {
        studentId: aliEntry.id,
        groupId: tajweedGroup.id,
        date: new Date(),
        attendance: "PRESENT",
        note: "E2E tajweed session",
      },
    });

    const extraContent = (text: string) => ({
      blocks: [{ type: "text" as const, value: text }],
    });

    await prisma.extraAssignment.createMany({
      data: [
        {
          title: "E2E Extra: Повторение суры Аль-Фатиха",
          content: extraContent("Прочитать суру Аль-Фатиха 3 раза"),
          stepId: firstQuranStep.id,
          authorId: manager.id,
          isSystem: true,
        },
        {
          title: "E2E Extra: Письменное задание",
          content: extraContent("Выписать аят из памяти"),
          stepId: secondQuranStep.id,
          authorId: superAdmin.id,
          isSystem: true,
        },
        {
          title: "E2E Extra: Учительское задание",
          content: extraContent("Дополнительная практика чтения"),
          stepId: firstQuranStep.id,
          authorId: teacher1User.id,
          isSystem: false,
        },
        {
          title: "E2E Catalog: Коран шаблон",
          content: extraContent("Коран"),
          stepId: firstQuranStep.id,
          authorId: teacher1User.id,
          isSystem: true,
        },
        {
          title: "E2E Catalog: Таджвид шаблон",
          content: extraContent("Таджвид"),
          stepId: firstTajweedStep.id,
          authorId: teacher1User.id,
          isSystem: true,
        },
      ],
    });

    const quranTemplate = await prisma.extraAssignment.create({
      data: {
        title: "E2E Extra: Коран для Али",
        content: extraContent("Повторить аят"),
        stepId: firstQuranStep.id,
        authorId: teacher1User.id,
        isSystem: true,
      },
    });

    const tajweedTemplate = await prisma.extraAssignment.create({
      data: {
        title: "E2E Extra: Таджвид для Али",
        content: extraContent("Практика таджвида"),
        stepId: firstTajweedStep.id,
        authorId: teacher1User.id,
        isSystem: true,
      },
    });

    const quranInstance = await prisma.studentExtraAssignment.create({
      data: {
        templateId: quranTemplate.id,
        studentId: aliEntry.id,
        sessionId: quranSession.id,
        displayStepId: firstQuranStep.id,
        assignedById: teacher1User.id,
      },
    });

    await prisma.extraAssignmentCompletion.create({
      data: {
        studentExtraAssignmentId: quranInstance.id,
        grade: PASSING_GRADE,
      },
    });

    const tajweedInstance = await prisma.studentExtraAssignment.create({
      data: {
        templateId: tajweedTemplate.id,
        studentId: aliEntry.id,
        sessionId: tajweedSession.id,
        displayStepId: firstTajweedStep.id,
        assignedById: teacher1User.id,
      },
    });

    await prisma.extraAssignmentCompletion.create({
      data: {
        studentExtraAssignmentId: tajweedInstance.id,
        grade: 5,
      },
    });
  }

  const studentCodes = e2eStudents.map((student) => student.code);
  const parentCodes = E2E_PARENT_PROFILES.map((parent) => parent.code);

  console.log("E2E seed completed (программа не изменялась):");
  console.log(`  Коран: ${quran.levels.length} уровней, предмет ${quran.subject.id}`);
  console.log(`  Таджвид: ${tajweed.levels.length} уровней, предмет ${tajweed.subject.id}`);
  console.log(`  SUPER_ADMIN: ${superAdmin.code}`);
  console.log(`  MANAGER: ${manager.code}`);
  console.log(`  ACCOUNTANT: ${accountant.code}`);
  console.log(`  TEACHER 1: ${teacher1User.code}`);
  console.log(`  TEACHER 2: ${teacher2User.code}`);
  console.log(`  PARENTS: ${parentCodes.join(", ")}`);
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
