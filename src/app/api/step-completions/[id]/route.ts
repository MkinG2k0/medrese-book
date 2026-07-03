import {
  error,
  notFound,
  serverError,
  success,
} from "@/shared/api";
import { authorizeApiRequest } from "@/shared/lib/authorize-api-request";
import { dispatchDomainEvent } from "@/shared/lib/domain-events";
import { prisma } from "@/shared/lib/prisma";
import { recalculateStudentStepIdx } from "@/shared/lib/student-progress";
import { updateStepCompletionSchema } from "@/shared/lib/validations/step-completion";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  const authResult = await authorizeApiRequest({
    allowedRoles: ["TEACHER"],
    context: { completionId: id },
  });
  if ("error" in authResult) return authResult.error;

  const existing = await prisma.stepCompletion.findUnique({
    where: { id },
    include: {
      step: { select: { title: true, order: true } },
      student: { include: { user: { select: { name: true } } } },
    },
  });
  if (!existing) return notFound("Запись");

  const body = await request.json();
  const parsed = updateStepCompletionSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.message);

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const completion = await tx.stepCompletion.update({
        where: { id },
        data: {
          grade: parsed.data.grade,
          note: parsed.data.note ?? null,
        },
        include: {
          step: true,
          session: { select: { id: true, date: true, attendance: true } },
        },
      });

      await recalculateStudentStepIdx(completion.studentId, tx);

      await dispatchDomainEvent(
        {
          actorId: authResult.session.user.id,
          action: "COMPLETION_CHANGED",
          entityType: "StepCompletion",
          entityId: completion.id,
          payload: {
            operation: "update",
            studentId: completion.studentId,
            studentName: existing.student.user.name,
            stepId: completion.stepId,
            stepTitle: completion.step.title,
            stepOrder: completion.step.order,
            previousGrade: existing.grade,
            grade: completion.grade,
            note: completion.note,
          },
        },
        tx,
      );

      return completion;
    });

    return success({
      id: updated.id,
      stepId: updated.stepId,
      grade: updated.grade,
      note: updated.note,
      createdAt: updated.createdAt,
      step: {
        order: updated.step.order,
        title: updated.step.title,
        hours: updated.step.hours,
      },
      session: updated.session,
    });
  } catch (err) {
    return serverError(err);
  }
}
