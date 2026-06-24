import { notFound } from "next/navigation";

import { BlockRenderer } from "@/features/program-admin/ui/BlockRenderer";
import { getStudentLessons } from "@/features/student-portal/actions/student-actions";
import { StudentSessionsTable } from "@/features/student-portal/ui/StudentSessionsTable";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";
import { requireRole } from "@/shared/lib/session";

export default async function StudentLessonsPage() {
  await requireRole("STUDENT");
  const data = await getStudentLessons();

  if (!data) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Title level={3}>Уроки</Title>

      {data.currentStep ? (
        <div>
          <Title level={4}>Текущий урок: {data.currentStep.title}</Title>
          <BlockRenderer blocks={data.currentStep.content.blocks} />
        </div>
      ) : (
        <Text type="secondary">Нет текущего урока</Text>
      )}

      <div>
        <Title level={4}>История занятий</Title>
        {data.sessions.length === 0 ? (
          <Text type="secondary">Пока нет занятий</Text>
        ) : (
          <StudentSessionsTable sessions={data.sessions} />
        )}
      </div>
    </div>
  );
}
