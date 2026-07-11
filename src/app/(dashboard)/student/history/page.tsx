import { notFound } from "next/navigation";

import {
  getStudentEnrollmentGroupIds,
  getStudentSessionHistory,
} from "@/features/student-portal/actions/student-actions";
import { resolveStudentGroupId } from "@/features/student-portal/lib/student-portal-query";
import { StudentSessionsTable } from "@/features/student-portal/ui/StudentSessionsTable";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";
import { requireRole } from "@/shared/lib/session";

type StudentHistoryPageProps = {
  searchParams: Promise<{ groupId?: string }>;
};

export default async function StudentHistoryPage({
  searchParams,
}: StudentHistoryPageProps) {
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
  const data = await getStudentSessionHistory(resolvedGroupId);

  if (!data) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Title level={3}>История занятий</Title>
        <Text type="secondary" className="block">
          {data.subjectName} — {data.groupName}
        </Text>
      </div>

      {data.sessions.length === 0 ? (
        <Text type="secondary">Пока нет занятий</Text>
      ) : (
        <StudentSessionsTable sessions={data.sessions} />
      )}
    </div>
  );
}
