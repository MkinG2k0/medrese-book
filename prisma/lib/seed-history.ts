import type { Attendance, PrismaClient, StudentStatus } from "../../src/shared/lib/db";

const PASSING_GRADE = 3;

export type StudentSeedProfile = {
  name: string;
  code: string;
  groupIndex: 0 | 1;
  level: 1 | 2 | 3 | 4 | 5;
  /** Пройденные шаги на текущем уровне. */
  stepsOnLevel: number;
  /** Месяц начала обучения: 0 = первый месяц периода, …, 5 = текущий месяц. */
  startMonthOffset: number;
  attendance: "good" | "average" | "poor" | "at-risk-month" | "at-risk-streak";
  gradeMin: number;
  gradeMax: number;
  status?: StudentStatus;
  parentCode: string;
  tuitionRate?: number;
  discountReason?: string;
};

export type ParentSeedProfile = {
  name: string;
  code: string;
  phone: string;
};

export type SeededParent = {
  id: string;
  name: string;
  phone: string | null;
};

const GUARDIAN_LAST_NAMES = [
  "Ибрагимов",
  "Ахмедов",
  "Мухаммадов",
  "Умаров",
  "Хасанов",
  "Алиев",
  "Саидов",
] as const;

const GUARDIAN_FIRST_NAMES = [
  "Рашид",
  "Ахмед",
  "Мухаммад",
  "Умар",
  "Хасан",
  "Салим",
  "Камил",
] as const;

export type StudentContactSeed = {
  fullName: string;
  phone: string;
  guardianName: string;
  guardianPhone: string;
};

export function buildStudentContactData(
  profile: Pick<StudentSeedProfile, "name" | "code">,
  index: number,
): StudentContactSeed {
  const lastName = GUARDIAN_LAST_NAMES[index % GUARDIAN_LAST_NAMES.length]!;
  const firstName =
    GUARDIAN_FIRST_NAMES[
      Math.floor(index / GUARDIAN_LAST_NAMES.length) % GUARDIAN_FIRST_NAMES.length
    ]!;
  const suffix = profile.code.slice(1);

  return {
    fullName: profile.name,
    phone: `8967${suffix}${String(index).padStart(2, "0")}`,
    guardianName: `${lastName} ${firstName}`,
    guardianPhone: `8968${suffix}${String(index).padStart(2, "0")}`,
  };
}

export const SEED_MONTHS = 6;

export type SeedContext = {
  now: Date;
  periodStart: Date;
  periodEnd: Date;
  currentMonthStart: Date;
};

/** Последние SEED_MONTHS месяцев, заканчивая сегодняшним днём. */
export function createSeedContext(now = new Date()): SeedContext {
  const periodEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59),
  );
  const periodStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (SEED_MONTHS - 1), 1),
  );
  const currentMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );

  return { now, periodStart, periodEnd, currentMonthStart };
}

export const PARENT_PROFILES: ParentSeedProfile[] = [
  { name: "Ибрагимов Рашид", code: "500001", phone: "89685000001" },
  { name: "Ахмедов Ахмед", code: "500002", phone: "89685000002" },
  { name: "Мухаммадов Мухаммад", code: "500003", phone: "89685000003" },
  { name: "Умаров Умар", code: "500004", phone: "89685000004" },
  { name: "Хасанов Хасан", code: "500005", phone: "89685000005" },
  { name: "Алиев Салим", code: "500006", phone: "89685000006" },
  { name: "Саидов Камил", code: "500007", phone: "89685000007" },
  { name: "Рахимов Карим", code: "500008", phone: "89685000008" },
  { name: "Нуриев Ильяс", code: "500009", phone: "89685000009" },
  { name: "Фатыхов Марат", code: "500010", phone: "89685000010" },
];

/** E2E: один опекун с двумя детьми, один с одним, один с двумя в разных группах. */
export const E2E_PARENT_PROFILES: ParentSeedProfile[] = [
  { name: "Ибрагимов Рашид", code: "500001", phone: "89685000001" },
  { name: "Ахмедов Ахмед", code: "500002", phone: "89685000002" },
  { name: "Мухаммадов Мухаммад", code: "500003", phone: "89685000003" },
];

export async function seedParentUsers(
  prisma: PrismaClient,
  profiles: ParentSeedProfile[],
): Promise<Map<string, SeededParent>> {
  const parentsByCode = new Map<string, SeededParent>();

  for (const profile of profiles) {
    const user = await prisma.user.create({
      data: {
        name: profile.name,
        code: profile.code,
        role: "PARENT",
        phone: profile.phone,
      },
    });
    parentsByCode.set(profile.code, {
      id: user.id,
      name: user.name,
      phone: user.phone,
    });
  }

  return parentsByCode;
}

export const STUDENT_PROFILES: StudentSeedProfile[] = [
  // Уровень 1 — начинающие (33 шага)
  { name: "Муса", code: "300013", groupIndex: 0, level: 1, stepsOnLevel: 0, startMonthOffset: 5, attendance: "good", gradeMin: 3, gradeMax: 4, parentCode: "500001" },
  { name: "Фарис", code: "300010", groupIndex: 0, level: 1, stepsOnLevel: 1, startMonthOffset: 4, attendance: "good", gradeMin: 3, gradeMax: 4, parentCode: "500001" },
  { name: "Билал", code: "300003", groupIndex: 0, level: 1, stepsOnLevel: 3, startMonthOffset: 3, attendance: "good", gradeMin: 3, gradeMax: 4, parentCode: "500001" },
  { name: "Умар", code: "300008", groupIndex: 0, level: 1, stepsOnLevel: 6, startMonthOffset: 2, attendance: "at-risk-month", gradeMin: 3, gradeMax: 3, parentCode: "500002" },
  { name: "Айюб", code: "300022", groupIndex: 1, level: 1, stepsOnLevel: 2, startMonthOffset: 4, attendance: "good", gradeMin: 3, gradeMax: 4, parentCode: "500002" },
  { name: "Зайд", code: "300005", groupIndex: 1, level: 1, stepsOnLevel: 5, startMonthOffset: 2, attendance: "average", gradeMin: 3, gradeMax: 4, parentCode: "500002" },
  // Уровень 2 (168 шагов)
  { name: "Усман", code: "300002", groupIndex: 0, level: 2, stepsOnLevel: 50, startMonthOffset: 0, attendance: "average", gradeMin: 3, gradeMax: 4, parentCode: "500003" },
  { name: "Ясин", code: "300007", groupIndex: 0, level: 2, stepsOnLevel: 140, startMonthOffset: 1, attendance: "average", gradeMin: 3, gradeMax: 5, parentCode: "500003" },
  { name: "Салих", code: "300014", groupIndex: 0, level: 2, stepsOnLevel: 30, startMonthOffset: 2, attendance: "average", gradeMin: 3, gradeMax: 4, status: "PAUSE", parentCode: "500004", tuitionRate: 150000, discountReason: "Многодетная семья" },
  { name: "Нух", code: "300011", groupIndex: 0, level: 2, stepsOnLevel: 80, startMonthOffset: 1, attendance: "at-risk-streak", gradeMin: 3, gradeMax: 3, parentCode: "500005" },
  { name: "Халид", code: "300004", groupIndex: 1, level: 2, stepsOnLevel: 120, startMonthOffset: 0, attendance: "good", gradeMin: 4, gradeMax: 5, parentCode: "500005" },
  { name: "Юсуф", code: "300016", groupIndex: 1, level: 2, stepsOnLevel: 60, startMonthOffset: 1, attendance: "average", gradeMin: 3, gradeMax: 4, parentCode: "500005" },
  // Уровень 3 (159 шагов)
  { name: "Али", code: "300001", groupIndex: 0, level: 3, stepsOnLevel: 100, startMonthOffset: 0, attendance: "good", gradeMin: 4, gradeMax: 5, parentCode: "500006" },
  { name: "Амир", code: "300006", groupIndex: 0, level: 3, stepsOnLevel: 140, startMonthOffset: 0, attendance: "good", gradeMin: 4, gradeMax: 5, parentCode: "500006" },
  { name: "Иса", code: "300012", groupIndex: 0, level: 3, stepsOnLevel: 80, startMonthOffset: 0, attendance: "good", gradeMin: 4, gradeMax: 5, parentCode: "500007" },
  { name: "Саид", code: "300009", groupIndex: 0, level: 3, stepsOnLevel: 50, startMonthOffset: 0, attendance: "poor", gradeMin: 3, gradeMax: 4, parentCode: "500007" },
  { name: "Дауд", code: "300017", groupIndex: 1, level: 3, stepsOnLevel: 30, startMonthOffset: 0, attendance: "poor", gradeMin: 3, gradeMax: 3, parentCode: "500008", tuitionRate: 180000, discountReason: "Скидка по заявлению" },
  // Уровень 4 (158 шагов)
  { name: "Ибрахим", code: "300015", groupIndex: 1, level: 4, stepsOnLevel: 100, startMonthOffset: 0, attendance: "good", gradeMin: 4, gradeMax: 5, parentCode: "500009" },
  { name: "Сулейман", code: "300018", groupIndex: 1, level: 4, stepsOnLevel: 120, startMonthOffset: 0, attendance: "good", gradeMin: 4, gradeMax: 5, parentCode: "500009" },
  { name: "Лукман", code: "300019", groupIndex: 1, level: 4, stepsOnLevel: 80, startMonthOffset: 1, attendance: "at-risk-month", gradeMin: 3, gradeMax: 4, parentCode: "500009" },
  // Уровень 5 — джузъ (37 шагов)
  { name: "Харун", code: "300020", groupIndex: 1, level: 5, stepsOnLevel: 20, startMonthOffset: 2, attendance: "average", gradeMin: 3, gradeMax: 4, parentCode: "500010" },
  { name: "Идрис", code: "300021", groupIndex: 1, level: 5, stepsOnLevel: 10, startMonthOffset: 3, attendance: "good", gradeMin: 3, gradeMax: 4, parentCode: "500010" },
];

/** Вторник и четверг каждой недели в периоде seed (не позже сегодня). */
export function buildLessonDates(ctx: SeedContext): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(ctx.periodStart);

  while (cursor <= ctx.periodEnd) {
    const day = cursor.getUTCDay();
    if (day === 2 || day === 4) {
      dates.push(new Date(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

export function monthStartOffsetToDate(offset: number, ctx: SeedContext): Date {
  return new Date(
    Date.UTC(
      ctx.periodStart.getUTCFullYear(),
      ctx.periodStart.getUTCMonth() + offset,
      1,
    ),
  );
}

function isCurrentMonth(date: Date, ctx: SeedContext): boolean {
  return (
    date.getUTCFullYear() === ctx.now.getUTCFullYear() &&
    date.getUTCMonth() === ctx.now.getUTCMonth()
  );
}

export function buildLevelStepOffsets(levelStepCounts: number[]): number[] {
  const offsets: number[] = [];
  let acc = 0;
  for (const count of levelStepCounts) {
    offsets.push(acc);
    acc += count;
  }
  return offsets;
}

export function getPassedStepIds(
  profile: StudentSeedProfile,
  levelStepIds: string[][],
): string[] {
  const passed: string[] = [];

  for (let levelIndex = 0; levelIndex < profile.level - 1; levelIndex++) {
    passed.push(...levelStepIds[levelIndex]!);
  }

  const currentLevelSteps = levelStepIds[profile.level - 1]!;
  passed.push(
    ...currentLevelSteps.slice(
      0,
      Math.min(profile.stepsOnLevel, currentLevelSteps.length),
    ),
  );

  return passed;
}

export function getCurrentStepIdx(
  profile: StudentSeedProfile,
  levelStepOffsets: number[],
): number {
  return levelStepOffsets[profile.level - 1]! + profile.stepsOnLevel;
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
  ctx: SeedContext,
): { attendance: Attendance; lateMinutes: number | null } {
  if (profile.attendance === "at-risk-streak" && sessionIndex >= totalSessions - 3) {
    return { attendance: "ABSENT", lateMinutes: null };
  }

  if (profile.attendance === "at-risk-month" && isCurrentMonth(date, ctx)) {
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
  groupId: string,
  profile: StudentSeedProfile,
  passedStepIds: string[],
  lessonDates: Date[],
  ctx: SeedContext,
): Promise<void> {
  if (passedStepIds.length === 0 && profile.stepsOnLevel === 0) {
    const startDate = monthStartOffsetToDate(profile.startMonthOffset, ctx);
    const firstLesson = lessonDates.find((d) => d >= startDate);
    if (!firstLesson) return;

    await prisma.session.create({
      data: {
        studentId,
        groupId,
        date: firstLesson,
        attendance: "PRESENT",
        note: "Первое занятие",
      },
    });
    return;
  }

  const startDate = monthStartOffsetToDate(profile.startMonthOffset, ctx);
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
      ctx,
    );

    const session = await prisma.session.create({
      data: {
        studentId,
        groupId,
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
