import { prisma } from "@/shared/lib/prisma";
import {
  countConsecutivePassedSteps,
  getCompletionsByStepId,
} from "@/shared/lib/step-completion";

export async function recalculateStudentStepIdx(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      completions: true,
      group: {
        include: {
          level: { include: { steps: { orderBy: { order: "asc" } } } },
        },
      },
    },
  });

  if (!student) return;

  const completionsByStepId = getCompletionsByStepId(student.completions);
  const newIdx = countConsecutivePassedSteps(
    student.group.level.steps,
    completionsByStepId,
  );

  if (newIdx !== student.currentStepIdx) {
    await prisma.student.update({
      where: { id: studentId },
      data: { currentStepIdx: newIdx },
    });
  }

  return newIdx;
}
