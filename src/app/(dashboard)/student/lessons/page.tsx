import { notFound } from "next/navigation";

import { getStudentLessons } from "@/features/student-portal/actions/student-actions";
import { StudentLessonsList } from "@/features/student-portal/ui/StudentLessonsList";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";
import { requireRole } from "@/shared/lib/session";

export default async function StudentLessonsPage() {
  await requireRole("STUDENT");
  const data = await getStudentLessons();

  if (!data) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Title level={3}>Уроки</Title>
        <Text type="secondary" className="block">
          {data.levelTitle}
        </Text>
      </div>

      {data.lessons.length === 0 ? (
        <Text type="secondary">Нет уроков в программе</Text>
      ) : (
        <StudentLessonsList lessons={data.lessons} />
      )}
    </div>
  );
}
