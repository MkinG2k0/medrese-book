import { auth } from "@/shared/lib/auth";
import { getLocalDateString, toSessionDate } from "@/shared/lib/calendar-date";
import { prisma } from "@/shared/lib/prisma";
import { updateStepProgress } from "@/shared/lib/step-progress";
import { createSessionSchema } from "@/shared/lib/validations/session";
import { created, error, forbidden, unauthorized } from "@/shared/api";

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
  const newSession = await prisma.session.create({
    data: {
      studentId,
      date: toSessionDate(calendarDay),
      attendance,
      lateMinutes: attendance === "LATE" ? lateMinutes : null,
      note,
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

  for (const completion of newSession.completions) {
    await updateStepProgress(studentId, completion.grade, attendance);
  }

  return created(newSession);
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  if (!studentId) return error("studentId обязателен");

  const sessions = await prisma.session.findMany({
    where: { studentId },
    include: { completions: { include: { step: true } } },
    orderBy: { date: "desc" },
    take: 30,
  });

  return Response.json({ data: sessions, error: null });
}
