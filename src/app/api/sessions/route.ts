import { revalidatePath } from "next/cache";

import {
  findStudentSessionForDay,
  serializeDaySession,
} from "@/features/journal/lib/get-student-session";
import {
  getCalendarDayQueryRange,
  getLocalDateString,
  isSameCalendarDay,
  toSessionDate,
} from "@/shared/lib/calendar-date";
import { authorizeApiRequest } from "@/shared/lib/authorize-api-request";
import { dispatchDomainEvent } from "@/shared/lib/domain-events";
import { prisma } from "@/shared/lib/prisma";
import { recalculateStudentStepIdx } from "@/shared/lib/student-progress";
import { createSessionSchema } from "@/shared/lib/validations/session";
import { created, error, success } from "@/shared/api";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.message);

  const { studentId, date, attendance, lateMinutes, note, completions } =
    parsed.data;

  const authResult = await authorizeApiRequest({
    allowedRoles: ["TEACHER"],
    context: { studentId },
  });
  if ("error" in authResult) return authResult.error;

  const calendarDay = getLocalDateString(new Date(date));
  const dayRange = getCalendarDayQueryRange(calendarDay);
  const existingSessions = await prisma.session.findMany({
    where: {
      studentId,
      date: { gte: dayRange.start, lte: dayRange.end },
    },
    include: { completions: true },
  });
  const existingSession = existingSessions.find((s) =>
    isSameCalendarDay(s.date, calendarDay),
  );

  const sessionData = {
    attendance,
    lateMinutes: attendance === "LATE" ? lateMinutes : null,
    note,
  };

  const savedSession = await prisma.$transaction(async (tx) => {
    const session = existingSession
      ? await tx.session.update({
          where: { id: existingSession.id },
          data: {
            ...sessionData,
            completions: {
              deleteMany: {},
              create: completions.map((c) => ({
                studentId,
                stepId: c.stepId,
                grade: c.grade,
                note: c.note,
              })),
            },
          },
          include: { completions: true },
        })
      : await tx.session.create({
          data: {
            studentId,
            date: toSessionDate(calendarDay),
            ...sessionData,
            completions: {
              create: completions.map((c) => ({
                studentId,
                stepId: c.stepId,
                grade: c.grade,
                note: c.note,
              })),
            },
          },
          include: { completions: true },
        });

    await recalculateStudentStepIdx(studentId, tx);

    await dispatchDomainEvent(
      {
        actorId: authResult.session.user.id,
        action: "SESSION_SAVED",
        entityType: "Session",
        entityId: session.id,
        payload: {
          studentId,
          attendance,
          completionCount: completions.length,
          isUpdate: Boolean(existingSession),
        },
      },
      tx,
    );

    return session;
  });

  revalidatePath("/journal");
  revalidatePath(`/journal/${studentId}`);

  return created(savedSession);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  if (!studentId) return error("studentId обязателен");

  const authResult = await authorizeApiRequest({
    allowedRoles: ["TEACHER", "MANAGER", "SUPER_ADMIN", "STUDENT"],
    context: { studentId },
  });
  if ("error" in authResult) return authResult.error;

  const dateStr = searchParams.get("date");

  if (dateStr) {
    const daySession = await findStudentSessionForDay(studentId, dateStr);

    if (!daySession) return success(null);

    return success(serializeDaySession(daySession));
  }

  const sessions = await prisma.session.findMany({
    where: { studentId },
    include: { completions: { include: { step: true } } },
    orderBy: { date: "desc" },
    take: 30,
  });

  return success(sessions);
}
