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

async function buildDurationMapsByGroup(
  completions: Array<{ session: { date: Date; groupId: string } }>,
): Promise<Map<string, Map<string, number | null>>> {
  const groupDateRanges = new Map<string, { gte: Date; lte: Date }>();

  for (const completion of completions) {
    const groupId = completion.session.groupId;
    const sessionTime = completion.session.date.getTime();
    const existing = groupDateRanges.get(groupId);

    if (!existing) {
      groupDateRanges.set(groupId, {
        gte: completion.session.date,
        lte: completion.session.date,
      });
      continue;
    }

    existing.gte = new Date(Math.min(existing.gte.getTime(), sessionTime));
    existing.lte = new Date(Math.max(existing.lte.getTime(), sessionTime));
  }

  const durationMapsByGroup = new Map<string, Map<string, number | null>>();

  await Promise.all(
    [...groupDateRanges.entries()].map(async ([groupId, dateRange]) => {
      durationMapsByGroup.set(
        groupId,
        await buildTeachingSessionDurationByDate(groupId, dateRange),
      );
    }),
  );

  return durationMapsByGroup;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  if (!studentId) return error("studentId обязателен");

  const dateStr = searchParams.get("date");
  if (dateStr && !isValidCalendarDate(dateStr)) {
    return error("Некорректная дата");
  }

  const subjectId = searchParams.get("subjectId");

  const authResult = await authorizeApiRequest({
    allowedRoles: ["TEACHER", "MANAGER", "SUPER_ADMIN"],
    context: { studentId },
  });
  if ("error" in authResult) return authResult.error;

  let legacyGroupId: string | null = null;
  if (!subjectId) {
    const enrollment = await prisma.groupEnrollment.findFirst({
      where: { studentId },
      orderBy: { enrolledAt: "asc" },
      select: { groupId: true },
    });
    if (!enrollment) return notFound("Ученик");
    legacyGroupId = enrollment.groupId;
  }

  const dayRange = dateStr ? getCalendarDayQueryRange(dateStr) : null;

  const sessionWhere = subjectId
    ? {
        isAdjustment: false,
        group: { subjectId },
        ...(dayRange
          ? { date: { gte: dayRange.start, lte: dayRange.end } }
          : {}),
      }
    : dayRange
      ? { date: { gte: dayRange.start, lte: dayRange.end } }
      : undefined;

  const rawCompletions = await prisma.stepCompletion.findMany({
    where: {
      studentId,
      ...(subjectId ? { isPriorCredit: false } : {}),
      ...(sessionWhere ? { session: sessionWhere } : {}),
    },
    include: {
      step: true,
      session: {
        select: {
          id: true,
          date: true,
          attendance: true,
          ...(subjectId ? { groupId: true } : {}),
        },
      },
    },
    orderBy: [{ step: { order: "asc" } }, { createdAt: "desc" }],
  });

  const completions = dateStr
    ? rawCompletions.filter((completion) =>
        isSameCalendarDay(completion.session.date, dateStr),
      )
    : rawCompletions;

  let durationByDate = new Map<string, number | null>();
  let durationMapsByGroup = new Map<string, Map<string, number | null>>();

  if (subjectId && completions.length > 0) {
    durationMapsByGroup = await buildDurationMapsByGroup(
      completions as Array<{ session: { date: Date; groupId: string } }>,
    );
  } else if (!subjectId && legacyGroupId) {
    const sessionDates = completions.map((completion) => completion.session.date);
    if (sessionDates.length > 0) {
      durationByDate = await buildTeachingSessionDurationByDate(legacyGroupId, {
        gte: new Date(
          Math.min(...sessionDates.map((date) => date.getTime())),
        ),
        lte: new Date(
          Math.max(...sessionDates.map((date) => date.getTime())),
        ),
      });
    }
  }

  return success(
    completions.map((completion) => {
      const sessionDurationMinutes = subjectId
        ? teachingSessionDurationFromMap(
            durationMapsByGroup.get(
              (completion.session as { groupId: string }).groupId,
            ) ?? new Map(),
            completion.session.date,
          )
        : teachingSessionDurationFromMap(
            durationByDate,
            completion.session.date,
          );

      return {
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
          sessionDurationMinutes,
        },
      };
    }),
  );
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const parsed = deleteStepCompletionsSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.message);

  const completions = await prisma.stepCompletion.findMany({
    where: { id: { in: parsed.data.ids } },
    include: {
      student: true,
      session: { select: { groupId: true } },
    },
  });

  if (completions.length === 0) return notFound("Записи");

  const studentIds = new Set(completions.map((c) => c.studentId));
  if (studentIds.size !== 1) {
    return error("Можно удалять записи только одного ученика");
  }

  const studentId = completions[0]!.studentId;
  const groupIds = new Set(completions.map((c) => c.session.groupId));
  if (groupIds.size !== 1) {
    return error("Можно удалять записи только одной группы");
  }
  const groupId = parsed.data.groupId ?? [...groupIds][0]!;

  if (parsed.data.groupId && parsed.data.groupId !== groupId) {
    return error("groupId не совпадает с сессией записей");
  }

  const authResult = await authorizeApiRequest({
    allowedRoles: ["TEACHER"],
    context: { studentId, groupId },
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
      await recalculateStudentStepIdx(studentId, groupId, tx);
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
