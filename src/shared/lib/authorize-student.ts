import { auth } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import { forbidden, unauthorized } from "@/shared/api";

export async function authorizeTeacherStudent(studentId: string) {
  const session = await auth();
  if (!session) return { error: unauthorized() } as const;
  if (session.user.role !== "TEACHER") return { error: forbidden() } as const;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { group: true, user: true },
  });

  if (!student) return { error: null, student: null } as const;
  if (student.group.teacherId !== session.user.teacherId) {
    return { error: forbidden() } as const;
  }

  return { error: null, student } as const;
}

export async function authorizeTeacherCompletion(completionId: string) {
  const session = await auth();
  if (!session) return { error: unauthorized() } as const;
  if (session.user.role !== "TEACHER") return { error: forbidden() } as const;

  const completion = await prisma.stepCompletion.findUnique({
    where: { id: completionId },
    include: {
      student: { include: { group: true, user: true } },
      step: true,
      session: true,
    },
  });

  if (!completion) return { error: null, completion: null } as const;
  if (completion.student.group.teacherId !== session.user.teacherId) {
    return { error: forbidden() } as const;
  }

  return { error: null, completion } as const;
}
