import "dotenv/config";

import { assertDestructiveSeedAllowed } from "./lib/seed-guard";

assertDestructiveSeedAllowed("e2e-seed");

import { PrismaClient } from "../src/shared/lib/db";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  LEVEL1_TITLE,
  LEVEL2_TITLE,
} from "./lib/program-config";
import { buildStudentContactData } from "./lib/seed-history";
import { buildContent, type StepDef } from "./lib/level1-import-utils";
import { DEFAULT_QURAN_SUBJECT_ID } from "./lib/subject-constants";

const E2E_STEPS_PER_LEVEL = 5;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function buildE2eSteps(): StepDef[] {
  return Array.from({ length: E2E_STEPS_PER_LEVEL }, (_, index) => {
    const order = index + 1;
    return {
      order,
      title: `E2E шаг ${order}`,
      lesson: `${order}`,
      letters: "ا",
      task: `Тестовое задание ${order}`,
      hours: 1,
    };
  });
}

async function createLevelWithSteps(
  subjectId: string,
  number: number,
  title: string,
  steps: StepDef[],
) {
  const level = await prisma.level.create({
    data: { subjectId, number, title },
  });

  await prisma.step.createMany({
    data: steps.map((step) => ({
      levelId: level.id,
      order: step.order,
      title: step.title,
      content: buildContent(step),
      hours: step.hours,
    })),
  });

  return level;
}

const PASSING_GRADE = 3;

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
  const e2eSteps = buildE2eSteps();

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
  await prisma.groupEnrollment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.group.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.user.deleteMany();
  await prisma.level.deleteMany();
  await prisma.subject.deleteMany();

  const quranSubject = await prisma.subject.create({
    data: {
      id: DEFAULT_QURAN_SUBJECT_ID,
      name: "Коран",
      description: "E2E программа",
    },
  });

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

  const level1 = await createLevelWithSteps(
    quranSubject.id,
    1,
    LEVEL1_TITLE,
    e2eSteps,
  );
  const level2 = await createLevelWithSteps(
    quranSubject.id,
    2,
    LEVEL2_TITLE,
    e2eSteps,
  );

  const [level1Steps, level2Steps] = await Promise.all([
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
      subjectId: quranSubject.id,
      teacherId: teacher1.id,
    },
  });

  const teacher1Group2 = await prisma.group.create({
    data: {
      name: "Группа Аль-Ихлас",
      subjectId: quranSubject.id,
      teacherId: teacher1.id,
    },
  });

  const group2 = await prisma.group.create({
    data: {
      name: "Группа Ан-Нас",
      subjectId: quranSubject.id,
      teacherId: teacher2.id,
    },
  });

  const studentNames = ["Али", "Усман", "Билал", "Халид", "Зайд"];
  const studentCodes = ["300001", "300002", "300003", "300004", "300005"];
  const level2StepOffset = e2eSteps.length;
  const studentsByName = new Map<
    string,
    { id: string; onLevel1: boolean; currentStepIdx: number }
  >();

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
    const contacts = buildStudentContactData(
      { name: studentNames[i]!, code: studentCodes[i]! },
      i,
    );
    const enrollmentGroupId = onLevel1 ? group1.id : group2.id;

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        fullName: contacts.fullName,
        phone: contacts.phone,
        guardianName: contacts.guardianName,
        guardianPhone: contacts.guardianPhone,
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

    studentsByName.set(studentNames[i]!, {
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

  const tajweedSubject = await prisma.subject.create({
    data: { name: "Таджвид", description: "E2E программа таджвида" },
  });

  const tajweedLevel = await createLevelWithSteps(
    tajweedSubject.id,
    1,
    "Таджвид 1",
    e2eSteps,
  );

  const tajweedSteps = await prisma.step.findMany({
    where: { levelId: tajweedLevel.id },
    orderBy: { order: "asc" },
    select: { id: true },
  });

  const tajweedGroup = await prisma.group.create({
    data: {
      name: "Группа Таджвид",
      subjectId: tajweedSubject.id,
      teacherId: teacher1.id,
    },
  });

  const aliEntry = studentsByName.get("Али");
  if (aliEntry && level1Steps[0]) {
    await prisma.groupEnrollment.create({
      data: {
        studentId: aliEntry.id,
        groupId: tajweedGroup.id,
        levelId: tajweedLevel.id,
        currentStepIdx: 0,
      },
    });

    const quranSession = await prisma.session.findFirst({
      where: { studentId: aliEntry.id, groupId: group1.id },
    });

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
          title: "E2E Catalog: Коран шаблон",
          content: extraContent("Коран"),
          stepId: level1Steps[0].id,
          authorId: teacher1User.id,
          isSystem: true,
        },
        {
          title: "E2E Catalog: Таджвид шаблон",
          content: extraContent("Таджвид"),
          stepId: tajweedSteps[0]!.id,
          authorId: teacher1User.id,
          isSystem: true,
        },
      ],
    });

    const quranTemplate = await prisma.extraAssignment.create({
      data: {
        title: "E2E Extra: Коран для Али",
        content: extraContent("Повторить аят"),
        stepId: level1Steps[0].id,
        authorId: teacher1User.id,
        isSystem: true,
      },
    });

    const tajweedTemplate = await prisma.extraAssignment.create({
      data: {
        title: "E2E Extra: Таджвид для Али",
        content: extraContent("Практика таджвида"),
        stepId: tajweedSteps[0]!.id,
        authorId: teacher1User.id,
        isSystem: true,
      },
    });

    if (quranSession) {
      const quranInstance = await prisma.studentExtraAssignment.create({
        data: {
          templateId: quranTemplate.id,
          studentId: aliEntry.id,
          sessionId: quranSession.id,
          displayStepId: level1Steps[0].id,
          assignedById: teacher1User.id,
        },
      });

      await prisma.extraAssignmentCompletion.create({
        data: {
          studentExtraAssignmentId: quranInstance.id,
          grade: PASSING_GRADE,
        },
      });
    }

    const tajweedInstance = await prisma.studentExtraAssignment.create({
      data: {
        templateId: tajweedTemplate.id,
        studentId: aliEntry.id,
        sessionId: tajweedSession.id,
        displayStepId: tajweedSteps[0]!.id,
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

  console.log("E2E seed completed:");
  console.log(`  Глава 1 и 2: по ${E2E_STEPS_PER_LEVEL} шагов (без DOCX)`);
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
