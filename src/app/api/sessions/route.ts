import { revalidatePath } from "next/cache";

import { auth } from "@/shared/lib/auth";
import {
  getCalendarDayQueryRange,
  getLocalDateString,
  isSameCalendarDay,
  toSessionDate,
} from "@/shared/lib/calendar-date";
import { prisma } from "@/shared/lib/prisma";
import { recalculateStudentStepIdx } from "@/shared/lib/recalculate-step-progress";
import { createSessionSchema } from "@/shared/lib/validations/session";
import { created, error, forbidden, success, unauthorized } from "@/shared/api";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return unauthorized();
  if (session.user.role !== "TEACHER") return forbidden();

  const body = await request.json();
  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.message);

  const { studentId, date, attendance, lateMinutes, note, completions } =
    parsed.data;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { group: true },
  });

  if (!student) return error("Ученик не найден", 404);
  if (student.group.teacherId !== session.user.teacherId) return forbidden();

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
  const session = await auth();
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  if (!studentId) return error("studentId обязателен");

  const dateStr = searchParams.get("date");

  if (dateStr) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { group: true },
    });

    if (!student) return error("Ученик не найден", 404);

    if (
      session.user.role === "TEACHER" &&
      session.user.teacherId !== student.group.teacherId
    ) {
      return forbidden();
    }

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
                type: true,
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
