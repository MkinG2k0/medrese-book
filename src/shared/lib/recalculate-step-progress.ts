import { prisma } from "@/shared/lib/prisma";
import { getStepOffsetForLevel } from "@/shared/lib/step-offset";
import {
  countConsecutivePassedSteps,
  getCompletionsByStepId,
  isStepPassed,
} from "@/shared/lib/step-completion";

export async function recalculateStudentStepIdx(studentId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      completions: true,
      level: { include: { steps: { orderBy: { order: "asc" } } } },
    },
  });

  if (!student) return;

  const stepOffset = await getStepOffsetForLevel(student.level.number);
  const completionsByStepId = getCompletionsByStepId(student.completions);
  const steps = student.level.steps;
  const passedInCurrentLevel = countConsecutivePassedSteps(
    steps,
    completionsByStepId,
  );
  const newIdx = stepOffset + passedInCurrentLevel;

  const allPassed =
    steps.length > 0 &&
    steps.every((step) =>
      isStepPassed(completionsByStepId.get(step.id)?.grade),
    );

  if (allPassed) {
    const nextLevel = await prisma.level.findFirst({
      where: { number: student.level.number + 1 },
    });

    if (nextLevel) {
      await prisma.student.update({
        where: { id: studentId },
        data: { levelId: nextLevel.id, currentStepIdx: newIdx },
      });
      return newIdx;
    }
  }

  if (newIdx !== student.currentStepIdx) {
    await prisma.student.update({
      where: { id: studentId },
      data: { currentStepIdx: newIdx },
    });
  }

  return newIdx;
}
