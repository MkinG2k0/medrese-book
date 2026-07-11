import { notFound } from "next/navigation";

import { getStudentEnrollmentDashboard } from "@/features/student-portal/actions/student-actions";
import { StudentEnrollmentCard } from "@/features/student-portal/ui/StudentEnrollmentCard";
import Title from "@/shared/ui/Title";
import { requireRole } from "@/shared/lib/session";

export default async function StudentMePage() {
  await requireRole("STUDENT");
  const dashboard = await getStudentEnrollmentDashboard();

  if (!dashboard || dashboard.enrollments.length === 0) notFound();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <Title level={3}>{dashboard.studentName}</Title>

      <div className="flex flex-col gap-4">
        {dashboard.enrollments.map((enrollment) => (
          <StudentEnrollmentCard
            key={enrollment.groupId}
            enrollment={enrollment}
          />
        ))}
      </div>
    </div>
  );
}
