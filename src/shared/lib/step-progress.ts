import { prisma, type Attendance } from "@/shared/lib/prisma";

export async function updateStepProgress(
  studentId: string,
  grade: number | null,
  attendance: Attendance,
) {
  const shouldAdvance = attendance !== "ABSENT";
  // TODO: Логика проверки оценки
  // && grade !== null && grade >= 3

  if (shouldAdvance) {
    await prisma.student.update({
      where: { id: studentId },
      data: { currentStepIdx: { increment: 1 } },
    });
  }
}
