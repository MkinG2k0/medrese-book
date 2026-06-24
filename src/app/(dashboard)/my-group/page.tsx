import { notFound } from "next/navigation";

import { getMyGroup } from "@/features/groups/actions/group-actions";
import { GroupStudentsTable } from "@/features/groups/ui/GroupStudentsTable";
import { getLevelsForStudentProfile } from "@/features/user-admin/actions/user-actions";
import { mapUsersToDetails } from "@/features/user-admin/lib/map-users-to-details";
import { requireRole } from "@/shared/lib/session";

export default async function MyGroupPage() {
  await requireRole("TEACHER");
  const [group, levels] = await Promise.all([
    getMyGroup(),
    getLevelsForStudentProfile(),
  ]);

  if (!group) notFound();

  const levelOptions = levels.map((level) => ({
    id: level.id,
    number: level.number,
    title: level.title,
    steps: level.steps.map((step) => ({
      id: step.id,
      order: step.order,
      title: step.title,
    })),
  }));

  const studentUsers = group.students.map((student) => ({
    ...student.user,
    student: {
      ...student,
      group: { name: group.name },
    },
  }));

  const users = mapUsersToDetails(studentUsers, levelOptions);

  return (
    <GroupStudentsTable
      title="Моя группа"
      subtitle={group.name}
      users={users}
      groups={[{ id: group.id, name: group.name }]}
      levels={levelOptions}
      readOnly
    />
  );
}
