import type { Attendance, PrismaClient, StudentStatus } from "../../src/shared/lib/db";

const PASSING_GRADE = 3;

export type StudentSeedProfile = {
  name: string;
  code: string;
  groupIndex: 0 | 1;
  level: 1 | 2 | 3 | 4 | 5;
  /** Пройденные шаги на текущем уровне. */
  stepsOnLevel: number;
  /** Месяц начала обучения: 0 = первый месяц периода, …, SEED_MONTHS-1 = текущий месяц. */
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

export const SEED_MONTHS = 3;

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
  // Группа 0 — Аль-Фатиха: 6 учеников
  { name: "Али", code: "300001", groupIndex: 0, level: 3, stepsOnLevel: 70, startMonthOffset: 0, attendance: "good", gradeMin: 4, gradeMax: 5, parentCode: "500001" },
  { name: "Усман", code: "300002", groupIndex: 0, level: 2, stepsOnLevel: 55, startMonthOffset: 0, attendance: "average", gradeMin: 3, gradeMax: 4, parentCode: "500001" },
  { name: "Билал", code: "300003", groupIndex: 0, level: 1, stepsOnLevel: 8, startMonthOffset: 1, attendance: "good", gradeMin: 3, gradeMax: 4, parentCode: "500002" },
  { name: "Умар", code: "300008", groupIndex: 0, level: 1, stepsOnLevel: 4, startMonthOffset: 2, attendance: "at-risk-month", gradeMin: 3, gradeMax: 3, parentCode: "500004" },
  { name: "Нух", code: "300011", groupIndex: 0, level: 2, stepsOnLevel: 36, startMonthOffset: 1, attendance: "at-risk-streak", gradeMin: 3, gradeMax: 3, parentCode: "500005" },
  { name: "Саид", code: "300009", groupIndex: 0, level: 3, stepsOnLevel: 28, startMonthOffset: 0, attendance: "poor", gradeMin: 3, gradeMax: 4, parentCode: "500006" },
  // Группа 1 — Ан-Нас: 6 учеников
  { name: "Халид", code: "300004", groupIndex: 1, level: 2, stepsOnLevel: 90, startMonthOffset: 0, attendance: "good", gradeMin: 4, gradeMax: 5, parentCode: "500003" },
  { name: "Зайд", code: "300005", groupIndex: 1, level: 1, stepsOnLevel: 6, startMonthOffset: 1, attendance: "average", gradeMin: 3, gradeMax: 4, parentCode: "500003" },
  { name: "Дауд", code: "300017", groupIndex: 1, level: 3, stepsOnLevel: 22, startMonthOffset: 0, attendance: "poor", gradeMin: 3, gradeMax: 3, parentCode: "500007", tuitionRate: 180000, discountReason: "Скидка по заявлению" },
  { name: "Ибрахим", code: "300015", groupIndex: 1, level: 4, stepsOnLevel: 48, startMonthOffset: 0, attendance: "good", gradeMin: 4, gradeMax: 5, parentCode: "500008" },
  { name: "Харун", code: "300020", groupIndex: 1, level: 5, stepsOnLevel: 14, startMonthOffset: 1, attendance: "average", gradeMin: 3, gradeMax: 4, parentCode: "500009" },
  { name: "Идрис", code: "300021", groupIndex: 1, level: 5, stepsOnLevel: 6, startMonthOffset: 2, attendance: "good", gradeMin: 3, gradeMax: 4, parentCode: "500010" },
];

export type TeacherLessonSchedule = {
  lessonStartHour: number;
  lessonStartMinute: number;
  durationMinutes: number;
};

export const TEACHER1_SCHEDULE: TeacherLessonSchedule = {
  lessonStartHour: 12,
  lessonStartMinute: 50,
  durationMinutes: 90,
};

export const TEACHER2_SCHEDULE: TeacherLessonSchedule = {
  lessonStartHour: 14,
  lessonStartMinute: 0,
  durationMinutes: 85,
};

export type TeacherRateSeedStep = {
  monthOffset: number;
  hourlyRateRubles: number;
};

export const TEACHER1_RATE_HISTORY: TeacherRateSeedStep[] = [
  { monthOffset: 0, hourlyRateRubles: 1800 },
  { monthOffset: 1, hourlyRateRubles: 2200 },
  { monthOffset: 2, hourlyRateRubles: 2600 },
];

export const TEACHER2_RATE_HISTORY: TeacherRateSeedStep[] = [
  { monthOffset: 0, hourlyRateRubles: 1500 },
  { monthOffset: 1, hourlyRateRubles: 1750 },
  { monthOffset: 2, hourlyRateRubles: 2100 },
];

/** Вторник и четверг каждой недели в периоде seed, плюс сегодня, если это не учебный день. */
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

  const today = new Date(
    Date.UTC(ctx.now.getUTCFullYear(), ctx.now.getUTCMonth(), ctx.now.getUTCDate()),
  );
  if (
    today >= ctx.periodStart &&
    today <= ctx.periodEnd &&
    !dates.some((date) => date.getTime() === today.getTime())
  ) {
    dates.push(today);
    dates.sort((a, b) => a.getTime() - b.getTime());
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

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** Дата в Europe/Moscow: календарный день берётся из UTC-даты seed. */
export function moscowDateTime(date: Date, hours: number, minutes: number): Date {
  const totalMinutes = hours * 60 + minutes;
  const normalizedHours = Math.floor(totalMinutes / 60);
  const normalizedMinutes = ((totalMinutes % 60) + 60) % 60;
  return new Date(
    `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}T${pad2(normalizedHours)}:${pad2(normalizedMinutes)}:00+03:00`,
  );
}

export async function seedTeacherRates(
  prisma: PrismaClient,
  teacherId: string,
  history: TeacherRateSeedStep[],
  ctx: SeedContext,
): Promise<void> {
  await prisma.teacherRate.createMany({
    data: history.map((step) => ({
      teacherId,
      hourlyRate: step.hourlyRateRubles * 100,
      validFrom: monthStartOffsetToDate(step.monthOffset, ctx),
    })),
  });
}

export async function seedTeachingSessions(
  prisma: PrismaClient,
  groupId: string,
  teacherId: string,
  lessonDates: Date[],
  schedule: TeacherLessonSchedule,
  seedKey: string,
): Promise<void> {
  const rand = seededRandom(hashCode(`lessons:${seedKey}`));

  await prisma.teachingSession.createMany({
    data: lessonDates.map((date) => {
      const lateMinutes = rand() < 0.18 ? 5 + Math.floor(rand() * 20) : 0;
      const durationJitter = Math.floor(rand() * 21) - 8;
      const duration = Math.max(55, schedule.durationMinutes + durationJitter);
      const startedAt = moscowDateTime(
        date,
        schedule.lessonStartHour,
        schedule.lessonStartMinute + lateMinutes,
      );
      const endedAt = new Date(startedAt.getTime() + duration * 60_000);

      return {
        groupId,
        teacherId,
        date,
        startedAt,
        endedAt,
        createdAt: startedAt,
      };
    }),
  });
}

export async function seedTeacherWorkplaceHistory(
  prisma: PrismaClient,
  teacherUserId: string,
  lessonDates: Date[],
  schedule: TeacherLessonSchedule,
  seedKey: string,
): Promise<void> {
  const rand = seededRandom(hashCode(`workplace:${seedKey}`));
  const events: {
    actorId: string;
    action: "USER_LOGIN" | "USER_LOGOUT";
    entityType: string;
    entityId: string;
    payload: Record<string, string>;
    createdAt: Date;
  }[] = [];

  for (const date of lessonDates) {
    const arriveEarly = 8 + Math.floor(rand() * 18);
    const login = moscowDateTime(
      date,
      schedule.lessonStartHour,
      schedule.lessonStartMinute - arriveEarly,
    );
    const leaveAfter = 6 + Math.floor(rand() * 22);
    const lessonEnd = moscowDateTime(
      date,
      schedule.lessonStartHour,
      schedule.lessonStartMinute + schedule.durationMinutes,
    );
    const logout = new Date(lessonEnd.getTime() + leaveAfter * 60_000);
    const skipLogout = rand() < 0.08;
    const skipDay = rand() < 0.04;

    if (skipDay) continue;

    events.push({
      actorId: teacherUserId,
      action: "USER_LOGIN",
      entityType: "User",
      entityId: teacherUserId,
      payload: {
        role: "TEACHER",
        loggedInAt: login.toISOString(),
      },
      createdAt: login,
    });

    if (!skipLogout) {
      events.push({
        actorId: teacherUserId,
        action: "USER_LOGOUT",
        entityType: "User",
        entityId: teacherUserId,
        payload: {
          role: "TEACHER",
          loggedOutAt: logout.toISOString(),
        },
        createdAt: logout,
      });
    }
  }

  if (events.length > 0) {
    await prisma.auditEvent.createMany({ data: events });
  }
}

export async function seedSessionDurationAdjustments(
  prisma: PrismaClient,
  teacherId: string,
  adjustedById: string,
): Promise<void> {
  const sessions = await prisma.teachingSession.findMany({
    where: { teacherId, endedAt: { not: null } },
    orderBy: { startedAt: "asc" },
  });
  if (sessions.length < 4) return;

  const target = sessions[Math.floor(sessions.length / 2)]!;
  const originalMinutes = Math.max(
    1,
    Math.round(
      (target.endedAt!.getTime() - target.startedAt.getTime()) / 60_000,
    ),
  );

  await prisma.teachingSessionDurationAdjustment.create({
    data: {
      teachingSessionId: target.id,
      originalMinutes,
      adjustedMinutes: originalMinutes + 15,
      reason: "Урок задержался: разбор ошибок чтения",
      adjustedById,
    },
  });
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

    const excused = attendance === "ABSENT" && rand() < 0.25;
    const session = await prisma.session.create({
      data: {
        studentId,
        groupId,
        date,
        attendance,
        lateMinutes,
        absenceExcused: excused,
        absenceReason: excused ? "Болезнь" : undefined,
        note:
          attendance === "LATE"
            ? "Опоздал к началу урока"
            : excused
              ? "Отсутствовал по болезни"
              : undefined,
      },
    });

    if (attendance === "ABSENT" || stepIndex >= passedStepIds.length) {
      continue;
    }

    const remainingSessions = Math.max(1, studentDates.length - i);
    const remainingSteps = passedStepIds.length - stepIndex;
    const take = Math.min(
      remainingSteps,
      Math.max(1, Math.ceil(remainingSteps / remainingSessions)),
    );

    for (let j = 0; j < take && stepIndex < passedStepIds.length; j++) {
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

  if (profile.attendance === "good") {
    await prisma.award.create({
      data: {
        studentId,
        type: "STUDY",
        title: "Старание на уроках",
        date: studentDates[Math.max(0, studentDates.length - 3)] ?? ctx.now,
      },
    });
  }
}

export type ExtraAssignmentTemplateSeed = {
  id: string;
  displayStepId: string;
};

export async function seedExtraAssignmentHistory(
  prisma: PrismaClient,
  templates: ExtraAssignmentTemplateSeed[],
  assignedById: string,
  profilesByStudentId: Map<string, StudentSeedProfile>,
): Promise<void> {
  if (templates.length === 0) return;

  const sessions = await prisma.session.findMany({
    where: { attendance: { in: ["PRESENT", "LATE"] } },
    select: { id: true, studentId: true, date: true },
    orderBy: { date: "asc" },
  });

  for (const session of sessions) {
    const profile = profilesByStudentId.get(session.studentId);
    if (!profile) continue;

    const rand = seededRandom(hashCode(`${profile.code}:${session.id}`));
    const extraChance =
      profile.attendance === "poor" || profile.attendance.startsWith("at-risk")
        ? 0.42
        : profile.attendance === "average"
          ? 0.22
          : 0.12;

    if (rand() >= extraChance) continue;

    const template = templates[Math.floor(rand() * templates.length)]!;
    const instance = await prisma.studentExtraAssignment.create({
      data: {
        templateId: template.id,
        studentId: session.studentId,
        sessionId: session.id,
        displayStepId: template.displayStepId,
        assignedById,
        createdAt: session.date,
      },
    });

    const completed = rand() < 0.72;
    if (!completed) continue;

    await prisma.extraAssignmentCompletion.create({
      data: {
        studentExtraAssignmentId: instance.id,
        grade: Math.max(
          PASSING_GRADE,
          pickGrade(rand, profile.gradeMin, profile.gradeMax),
        ),
        note: rand() < 0.2 ? "Нужно повторить ещё раз дома" : undefined,
        gradedAt: new Date(session.date.getTime() + 2 * 60 * 60 * 1000),
        createdAt: session.date,
      },
    });
  }
}
