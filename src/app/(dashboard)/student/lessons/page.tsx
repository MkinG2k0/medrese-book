import { notFound } from "next/navigation";

import {
  getStudentEnrollmentGroupIds,
  getStudentLessons,
} from "@/features/student-portal/actions/student-actions";
import { resolveStudentGroupId } from "@/features/student-portal/lib/student-portal-query";
import { StudentLessonsList } from "@/features/student-portal/ui/StudentLessonsList";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";
import { requireRole } from "@/shared/lib/session";

type StudentLessonsPageProps = {
  searchParams: Promise<{ groupId?: string }>;
};

export default async function StudentLessonsPage({
  searchParams,
}: StudentLessonsPageProps) {
  await requireRole("STUDENT");
  const params = await searchParams;
  const allowedGroupIds = await getStudentEnrollmentGroupIds();

  if (allowedGroupIds.length === 0) notFound();

  const primaryGroupId = allowedGroupIds[0];
  const resolvedGroupId = resolveStudentGroupId(
    params.groupId,
    allowedGroupIds,
    primaryGroupId,
  );
  const data = await getStudentLessons(resolvedGroupId);

  if (!data) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Title level={3}>Уроки</Title>
        <Text type="secondary" className="block">
          {data.subjectName} — {data.groupName}
        </Text>
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
