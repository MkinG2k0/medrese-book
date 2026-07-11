import { requireRole } from "@/shared/lib/session";
import { StudentExtraAssignmentsHistory } from "@/features/student-portal/ui/StudentExtraAssignmentsHistory";
import Title from "@/shared/ui/Title";

export default async function StudentExtraAssignmentsPage() {
  await requireRole("STUDENT");

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Title level={3}>Доп. задания</Title>
      <StudentExtraAssignmentsHistory />
    </div>
  );
}
