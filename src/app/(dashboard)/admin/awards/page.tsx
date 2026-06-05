import {
  getAwards,
  getStudentsForAwards,
} from "@/features/awards/actions/award-actions";
import { AwardsManager } from "@/features/awards/ui/AwardsManager";
import { requireRoles } from "@/shared/lib/session";
import Title from "@/shared/ui/Title";

export default async function AdminAwardsPage() {
  await requireRoles(["MANAGER", "SUPER_ADMIN"]);

  const [awards, students] = await Promise.all([
    getAwards(),
    getStudentsForAwards(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <Title level={3}>Награды</Title>
      <AwardsManager
        awards={awards.map((a) => ({
          id: a.id,
          studentName: a.student.user.name,
          type: a.type,
          title: a.title,
          date: a.date,
        }))}
        students={students.map((s) => ({ id: s.id, name: s.user.name }))}
      />
    </div>
  );
}
