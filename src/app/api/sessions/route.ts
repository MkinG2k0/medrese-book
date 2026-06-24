import { revalidatePath } from "next/cache";

import {
  getCalendarDayQueryRange,
  getLocalDateString,
  isSameCalendarDay,
  toSessionDate,
} from "@/shared/lib/calendar-date";
import { authorizeApiRequest } from "@/shared/lib/authorize-api-request";
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

  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student) return error("Ученик не найден", 404);

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

  const savedSession = existingSession
    ? await prisma.session.update({
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
    : await prisma.session.create({
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

  await recalculateStudentStepIdx(studentId);

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
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) return error("Ученик не найден", 404);

    const dayRange = getCalendarDayQueryRange(dateStr);
    const daySessions = await prisma.session.findMany({
      where: {
        studentId,
        date: { gte: dayRange.start, lte: dayRange.end },
      },
      include: {
        completions: {
          include: {
            step: {
              select: {
                id: true,
                order: true,
                title: true,
                content: true,
                hours: true,
                level: { select: { number: true, title: true } },
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    });
    const daySession =
      daySessions.find((s) => isSameCalendarDay(s.date, dateStr)) ?? null;

    if (!daySession) return success(null);

    return success({
      ...daySession,
      completions: daySession.completions.map((completion) => ({
        stepId: completion.stepId,
        grade: completion.grade,
        note: completion.note,
        step: completion.step,
      })),
    });
  }

  const sessions = await prisma.session.findMany({
    where: { studentId },
    include: { completions: { include: { step: true } } },
    orderBy: { date: "desc" },
    take: 30,
  });

  return success(sessions);
}
