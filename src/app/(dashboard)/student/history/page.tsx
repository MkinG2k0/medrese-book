import { notFound } from "next/navigation";

import { getStudentSessionHistory } from "@/features/student-portal/actions/student-actions";
import { StudentSessionsTable } from "@/features/student-portal/ui/StudentSessionsTable";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";
import { requireRole } from "@/shared/lib/session";

export default async function StudentHistoryPage() {
  await requireRole("STUDENT");
  const data = await getStudentSessionHistory();

  if (!data) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Title level={3}>История занятий</Title>

      {data.sessions.length === 0 ? (
        <Text type="secondary">Пока нет занятий</Text>
      ) : (
        <StudentSessionsTable sessions={data.sessions} />
      )}
    </div>
  );
}
