import type { Attendance, PrismaClient, StudentStatus } from "../../src/shared/lib/db";

const PASSING_GRADE = 3;

export type StudentSeedProfile = {
  name: string;
  code: string;
  groupIndex: 0 | 1;
  level: 1 | 2;
  /** Пройденные шаги на текущем уровне (для 2-й главы — только шаги главы 2). */
  stepsOnLevel: number;
  /** Месяц начала обучения: 0 = февраль 2026, …, 5 = июль 2026. */
  startMonthOffset: number;
  attendance: "good" | "average" | "poor" | "at-risk-month" | "at-risk-streak";
  gradeMin: number;
  gradeMax: number;
  status?: StudentStatus;
};

export const SEED_PERIOD = {
  year: 2026,
  startMonth: 1, // февраль (0-based)
  endMonth: 6, // июль
} as const;

export const STUDENT_PROFILES: StudentSeedProfile[] = [
  // Группа Аль-Фатиха — глава 1
  { name: "Али", code: "300001", groupIndex: 0, level: 1, stepsOnLevel: 18, startMonthOffset: 0, attendance: "good", gradeMin: 4, gradeMax: 5 },
  { name: "Усман", code: "300002", groupIndex: 0, level: 1, stepsOnLevel: 10, startMonthOffset: 0, attendance: "average", gradeMin: 3, gradeMax: 4 },
  { name: "Билал", code: "300003", groupIndex: 0, level: 1, stepsOnLevel: 3, startMonthOffset: 3, attendance: "good", gradeMin: 3, gradeMax: 4 },
  { name: "Амир", code: "300006", groupIndex: 0, level: 1, stepsOnLevel: 22, startMonthOffset: 0, attendance: "good", gradeMin: 4, gradeMax: 5 },
  { name: "Ясин", code: "300007", groupIndex: 0, level: 1, stepsOnLevel: 14, startMonthOffset: 1, attendance: "average", gradeMin: 3, gradeMax: 5 },
  { name: "Умар", code: "300008", groupIndex: 0, level: 1, stepsOnLevel: 6, startMonthOffset: 2, attendance: "at-risk-month", gradeMin: 3, gradeMax: 3 },
  { name: "Саид", code: "300009", groupIndex: 0, level: 1, stepsOnLevel: 12, startMonthOffset: 0, attendance: "poor", gradeMin: 3, gradeMax: 4 },
  { name: "Фарис", code: "300010", groupIndex: 0, level: 1, stepsOnLevel: 1, startMonthOffset: 4, attendance: "good", gradeMin: 3, gradeMax: 4 },
  { name: "Нух", code: "300011", groupIndex: 0, level: 1, stepsOnLevel: 8, startMonthOffset: 1, attendance: "at-risk-streak", gradeMin: 3, gradeMax: 3 },
  { name: "Иса", code: "300012", groupIndex: 0, level: 1, stepsOnLevel: 16, startMonthOffset: 0, attendance: "good", gradeMin: 4, gradeMax: 5 },
  { name: "Муса", code: "300013", groupIndex: 0, level: 1, stepsOnLevel: 0, startMonthOffset: 5, attendance: "good", gradeMin: 3, gradeMax: 4 },
  { name: "Салих", code: "300014", groupIndex: 0, level: 1, stepsOnLevel: 5, startMonthOffset: 2, attendance: "average", gradeMin: 3, gradeMax: 4, status: "PAUSE" },
  // Группа Ан-Нас — глава 2
  { name: "Халид", code: "300004", groupIndex: 1, level: 2, stepsOnLevel: 12, startMonthOffset: 0, attendance: "good", gradeMin: 4, gradeMax: 5 },
  { name: "Зайд", code: "300005", groupIndex: 1, level: 2, stepsOnLevel: 5, startMonthOffset: 2, attendance: "average", gradeMin: 3, gradeMax: 4 },
  { name: "Ибрахим", code: "300015", groupIndex: 1, level: 2, stepsOnLevel: 20, startMonthOffset: 0, attendance: "good", gradeMin: 4, gradeMax: 5 },
  { name: "Юсуф", code: "300016", groupIndex: 1, level: 2, stepsOnLevel: 8, startMonthOffset: 1, attendance: "average", gradeMin: 3, gradeMax: 4 },
  { name: "Дауд", code: "300017", groupIndex: 1, level: 2, stepsOnLevel: 3, startMonthOffset: 0, attendance: "poor", gradeMin: 3, gradeMax: 3 },
  { name: "Сулейман", code: "300018", groupIndex: 1, level: 2, stepsOnLevel: 15, startMonthOffset: 0, attendance: "good", gradeMin: 4, gradeMax: 5 },
  { name: "Лукман", code: "300019", groupIndex: 1, level: 2, stepsOnLevel: 10, startMonthOffset: 1, attendance: "at-risk-month", gradeMin: 3, gradeMax: 4 },
  { name: "Харун", code: "300020", groupIndex: 1, level: 2, stepsOnLevel: 7, startMonthOffset: 2, attendance: "average", gradeMin: 3, gradeMax: 4 },
  { name: "Идрис", code: "300021", groupIndex: 1, level: 2, stepsOnLevel: 2, startMonthOffset: 4, attendance: "good", gradeMin: 3, gradeMax: 4 },
  { name: "Айюб", code: "300022", groupIndex: 1, level: 2, stepsOnLevel: 0, startMonthOffset: 5, attendance: "good", gradeMin: 3, gradeMax: 4 },
];

/** Вторник и четверг каждой недели в периоде seed. */
export function buildLessonDates(): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(Date.UTC(SEED_PERIOD.year, SEED_PERIOD.startMonth, 1));
  const end = new Date(Date.UTC(SEED_PERIOD.year, SEED_PERIOD.endMonth + 1, 0, 23, 59, 59));

  while (cursor <= end) {
    const day = cursor.getUTCDay();
    if (day === 2 || day === 4) {
      dates.push(new Date(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

export function monthStartOffsetToDate(offset: number): Date {
  return new Date(Date.UTC(SEED_PERIOD.year, SEED_PERIOD.startMonth + offset, 1));
}

export function getPassedStepIds(
  profile: StudentSeedProfile,
  level1StepIds: string[],
  level2StepIds: string[],
  level2StepOffset: number,
): string[] {
  if (profile.level === 1) {
    return level1StepIds.slice(0, profile.stepsOnLevel);
  }

  return [
    ...level1StepIds,
    ...level2StepIds.slice(0, profile.stepsOnLevel),
  ];
}

export function getCurrentStepIdx(
  profile: StudentSeedProfile,
  level2StepOffset: number,
): number {
  if (profile.level === 1) {
    return profile.stepsOnLevel;
  }

  return level2StepOffset + profile.stepsOnLevel;
}

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickGrade(rand: () => number, min: number, max: number): number {
  const span = max - min + 1;
  return min + Math.floor(rand() * span);
}

function resolveAttendance(
  profile: StudentSeedProfile,
  date: Date,
  sessionIndex: number,
  totalSessions: number,
  rand: () => number,
): { attendance: Attendance; lateMinutes: number | null } {
  if (profile.attendance === "at-risk-streak" && sessionIndex >= totalSessions - 3) {
    return { attendance: "ABSENT", lateMinutes: null };
  }

  const isJuly =
    date.getUTCFullYear() === SEED_PERIOD.year &&
    date.getUTCMonth() === SEED_PERIOD.endMonth;

  if (profile.attendance === "at-risk-month" && isJuly) {
    const julyAbsentSlots = [0, 2, 4, 6];
    if (julyAbsentSlots.includes(sessionIndex % 8)) {
      return { attendance: "ABSENT", lateMinutes: null };
    }
  }

  const roll = rand();
  switch (profile.attendance) {
    case "good":
      if (roll < 0.08) return { attendance: "LATE", lateMinutes: 5 + Math.floor(rand() * 15) };
      if (roll < 0.1) return { attendance: "ABSENT", lateMinutes: null };
      return { attendance: "PRESENT", lateMinutes: null };
    case "average":
      if (roll < 0.12) return { attendance: "LATE", lateMinutes: 10 + Math.floor(rand() * 20) };
      if (roll < 0.2) return { attendance: "ABSENT", lateMinutes: null };
      return { attendance: "PRESENT", lateMinutes: null };
    case "poor":
      if (roll < 0.25) return { attendance: "LATE", lateMinutes: 15 + Math.floor(rand() * 25) };
      if (roll < 0.4) return { attendance: "ABSENT", lateMinutes: null };
      return { attendance: "PRESENT", lateMinutes: null };
    case "at-risk-month":
    case "at-risk-streak":
      if (roll < 0.1) return { attendance: "LATE", lateMinutes: 10 + Math.floor(rand() * 10) };
      if (roll < 0.18) return { attendance: "ABSENT", lateMinutes: null };
      return { attendance: "PRESENT", lateMinutes: null };
    default:
      return { attendance: "PRESENT", lateMinutes: null };
  }
}

export async function seedTeachingSessions(
  prisma: PrismaClient,
  groupId: string,
  teacherId: string,
  lessonDates: Date[],
): Promise<void> {
  for (const date of lessonDates) {
    const startedAt = new Date(date);
    startedAt.setUTCHours(14, 0, 0, 0);
    const endedAt = new Date(startedAt);
    endedAt.setUTCHours(15, 30, 0, 0);

    await prisma.teachingSession.create({
      data: {
        groupId,
        teacherId,
        date,
        startedAt,
        endedAt,
      },
    });
  }
}

export async function seedStudentHistory(
  prisma: PrismaClient,
  studentId: string,
  profile: StudentSeedProfile,
  passedStepIds: string[],
  lessonDates: Date[],
): Promise<void> {
  if (passedStepIds.length === 0 && profile.stepsOnLevel === 0) {
    const startDate = monthStartOffsetToDate(profile.startMonthOffset);
    const firstLesson = lessonDates.find((d) => d >= startDate);
    if (!firstLesson) return;

    await prisma.session.create({
      data: {
        studentId,
        date: firstLesson,
        attendance: "PRESENT",
        note: "Первое занятие",
      },
    });
    return;
  }

  const startDate = monthStartOffsetToDate(profile.startMonthOffset);
  const studentDates = lessonDates.filter((d) => d >= startDate);
  const rand = seededRandom(hashCode(profile.code));
  let stepIndex = 0;
  const stepsPerSession = Math.max(1, Math.ceil(passedStepIds.length / Math.max(studentDates.length * 0.55, 1)));

  for (let i = 0; i < studentDates.length; i++) {
    const date = studentDates[i]!;
    const { attendance, lateMinutes } = resolveAttendance(
      profile,
      date,
      i,
      studentDates.length,
      rand,
    );

    const session = await prisma.session.create({
      data: {
        studentId,
        date,
        attendance,
        lateMinutes,
      },
    });

    if (attendance === "ABSENT" || stepIndex >= passedStepIds.length) {
      continue;
    }

    const shouldComplete =
      stepIndex < passedStepIds.length &&
      (i % stepsPerSession === 0 || rand() < 0.35);

    if (!shouldComplete) continue;

    const stepsThisSession = rand() < 0.15 && stepIndex + 1 < passedStepIds.length ? 2 : 1;

    for (let j = 0; j < stepsThisSession && stepIndex < passedStepIds.length; j++) {
      const grade = Math.max(
        PASSING_GRADE,
        pickGrade(rand, profile.gradeMin, profile.gradeMax),
      );

      await prisma.stepCompletion.create({
        data: {
          studentId,
          stepId: passedStepIds[stepIndex]!,
          sessionId: session.id,
          grade,
          createdAt: date,
        },
      });
      stepIndex++;
    }
  }
}
