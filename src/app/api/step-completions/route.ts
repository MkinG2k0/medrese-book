import {
  error,
  forbidden,
  notFound,
  serverError,
  success,
  unauthorized,
} from "@/shared/api";
import {
  getCalendarDayQueryRange,
  isSameCalendarDay,
  isValidCalendarDate,
} from "@/shared/lib/calendar-date";
import { auth } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import { recalculateStudentStepIdx } from "@/shared/lib/recalculate-step-progress";
import { authorizeTeacherStudent } from "@/shared/lib/authorize-student";
import { deleteStepCompletionsSchema } from "@/shared/lib/validations/step-completion";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return unauthorized();
  if (session.user.role !== "TEACHER") return forbidden();

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  if (!studentId) return error("studentId обязателен");

  const dateStr = searchParams.get("date");
  if (dateStr && !isValidCalendarDate(dateStr)) {
    return error("Некорректная дата");
  }

  const authResult = await authorizeTeacherStudent(studentId);
  if (authResult.error) return authResult.error;
  if (!authResult.student) return notFound("Ученик");

  const dayRange = dateStr ? getCalendarDayQueryRange(dateStr) : null;

  const rawCompletions = await prisma.stepCompletion.findMany({
    where: {
      studentId,
      ...(dayRange
        ? { session: { date: { gte: dayRange.start, lte: dayRange.end } } }
        : {}),
    },
    include: {
      step: true,
      session: { select: { id: true, date: true, attendance: true } },
    },
    orderBy: [{ step: { order: "asc" } }, { createdAt: "desc" }],
  });

  const completions = dateStr
    ? rawCompletions.filter((completion) =>
        isSameCalendarDay(completion.session.date, dateStr),
      )
    : rawCompletions;

  return success(
    completions.map((completion) => ({
      id: completion.id,
      stepId: completion.stepId,
      grade: completion.grade,
      note: completion.note,
      createdAt: completion.createdAt,
      step: {
        order: completion.step.order,
        title: completion.step.title,
        type: completion.step.type,
        hours: completion.step.hours,
      },
      session: completion.session,
    })),
  );
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session) return unauthorized();
  if (session.user.role !== "TEACHER") return forbidden();

  const body = await request.json();
  const parsed = deleteStepCompletionsSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.message);

  const completions = await prisma.stepCompletion.findMany({
    where: { id: { in: parsed.data.ids } },
    include: { student: { include: { group: true } } },
  });

  if (completions.length === 0) return notFound("Записи");

  const studentIds = new Set(completions.map((c) => c.studentId));
  if (studentIds.size !== 1) {
    return error("Можно удалять записи только одного ученика");
  }

  const studentId = completions[0]!.studentId;
  const authResult = await authorizeTeacherStudent(studentId);
  if (authResult.error) return authResult.error;

  if (completions.length !== parsed.data.ids.length) {
    return error("Некоторые записи не найдены", 404);
  }

  try {
    await prisma.stepCompletion.deleteMany({
      where: { id: { in: parsed.data.ids } },
    });
    await recalculateStudentStepIdx(studentId);
    return success({ deleted: parsed.data.ids.length });
  } catch (err) {
    return serverError(err);
  }
}
