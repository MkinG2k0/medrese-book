import {
  error,
  notFound,
  serverError,
  success,
} from "@/shared/api";
import {
  getCalendarDayQueryRange,
  isSameCalendarDay,
  isValidCalendarDate,
} from "@/shared/lib/calendar-date";
import { authorizeApiRequest } from "@/shared/lib/authorize-api-request";
import { dispatchDomainEvent } from "@/shared/lib/domain-events";
import { prisma } from "@/shared/lib/prisma";
import { recalculateStudentStepIdx } from "@/shared/lib/student-progress";
import {
  buildTeachingSessionDurationByDate,
  teachingSessionDurationFromMap,
} from "@/shared/lib/teaching-session-duration-map";
import { deleteStepCompletionsSchema } from "@/shared/lib/validations/step-completion";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  if (!studentId) return error("studentId обязателен");

  const dateStr = searchParams.get("date");
  if (dateStr && !isValidCalendarDate(dateStr)) {
    return error("Некорректная дата");
  }

  const authResult = await authorizeApiRequest({
    allowedRoles: ["TEACHER", "MANAGER", "SUPER_ADMIN"],
    context: { studentId },
  });
  if ("error" in authResult) return authResult.error;

  const enrollment = await prisma.groupEnrollment.findFirst({
    where: { studentId },
    orderBy: { enrolledAt: "asc" },
    select: { groupId: true },
  });
  if (!enrollment) return notFound("Ученик");

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

  const sessionDates = completions.map((completion) => completion.session.date);
  const durationByDate =
    sessionDates.length > 0
      ? await buildTeachingSessionDurationByDate(enrollment.groupId, {
          gte: new Date(
            Math.min(...sessionDates.map((date) => date.getTime())),
          ),
          lte: new Date(
            Math.max(...sessionDates.map((date) => date.getTime())),
          ),
        })
      : new Map<string, number | null>();

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
        hours: completion.step.hours,
      },
      session: {
        ...completion.session,
        sessionDurationMinutes: teachingSessionDurationFromMap(
          durationByDate,
          completion.session.date,
        ),
      },
    })),
  );
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const parsed = deleteStepCompletionsSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.message);

  const completions = await prisma.stepCompletion.findMany({
    where: { id: { in: parsed.data.ids } },
    include: { student: true },
  });

  if (completions.length === 0) return notFound("Записи");

  const studentIds = new Set(completions.map((c) => c.studentId));
  if (studentIds.size !== 1) {
    return error("Можно удалять записи только одного ученика");
  }

  const studentId = completions[0]!.studentId;
  const authResult = await authorizeApiRequest({
    allowedRoles: ["TEACHER"],
    context: { studentId },
  });
  if ("error" in authResult) return authResult.error;

  if (completions.length !== parsed.data.ids.length) {
    return error("Некоторые записи не найдены", 404);
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.stepCompletion.deleteMany({
        where: { id: { in: parsed.data.ids } },
      });
      await recalculateStudentStepIdx(studentId, tx);
      await dispatchDomainEvent(
        {
          actorId: authResult.session.user.id,
          action: "COMPLETION_CHANGED",
          entityType: "StepCompletion",
          entityId: studentId,
          payload: {
            operation: "delete",
            completionIds: parsed.data.ids,
            studentId,
          },
        },
        tx,
      );
    });
    return success({ deleted: parsed.data.ids.length });
  } catch (err) {
    return serverError(err);
  }
}
