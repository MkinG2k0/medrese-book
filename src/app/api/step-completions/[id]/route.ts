import {
  error,
  forbidden,
  notFound,
  serverError,
  success,
  unauthorized,
} from "@/shared/api";
import { auth } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import { recalculateStudentStepIdx } from "@/shared/lib/recalculate-step-progress";
import { authorizeTeacherCompletion } from "@/shared/lib/authorize-student";
import { updateStepCompletionSchema } from "@/shared/lib/validations/step-completion";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session) return unauthorized();
  if (session.user.role !== "TEACHER") return forbidden();

  const { id } = await context.params;
  const authResult = await authorizeTeacherCompletion(id);
  if (authResult.error) return authResult.error;
  if (!authResult.completion) return notFound("Запись");

  const body = await request.json();
  const parsed = updateStepCompletionSchema.safeParse(body);
  if (!parsed.success) return error(parsed.error.message);

  try {
    const updated = await prisma.stepCompletion.update({
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

    await recalculateStudentStepIdx(updated.studentId);

    return success({
      id: updated.id,
      stepId: updated.stepId,
      grade: updated.grade,
      note: updated.note,
      createdAt: updated.createdAt,
      step: {
        order: updated.step.order,
        title: updated.step.title,
        type: updated.step.type,
        hours: updated.step.hours,
      },
      session: updated.session,
    });
  } catch (err) {
    return serverError(err);
  }
}
