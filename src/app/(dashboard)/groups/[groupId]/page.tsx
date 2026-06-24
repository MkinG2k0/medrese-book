import { notFound } from "next/navigation";

import { getGroup } from "@/features/groups/actions/group-actions";
import { GroupStudentsTable } from "@/features/groups/ui/GroupStudentsTable";
import {
  getLevelsForCreateUser,
} from "@/features/user-admin/actions/user-actions";
import { mapUsersToDetails } from "@/features/user-admin/lib/map-users-to-details";
import { prisma } from "@/shared/lib/prisma";
import { requireRoles } from "@/shared/lib/session";

type Props = { params: Promise<{ groupId: string }> };

export default async function GroupDetailPage({ params }: Props) {
  const session = await requireRoles(["MANAGER", "SUPER_ADMIN"]);
  const { groupId } = await params;
  const [groups, levels, { group }] = await Promise.all([
    prisma.group.findMany({ select: { id: true, name: true } }),
    getLevelsForCreateUser(),
    getGroup(groupId),
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
      title={group.name}
      subtitle={`Учитель: ${group.teacher.user.name}`}
      users={users}
      groups={groups}
      levels={levelOptions}
      canResetCode={session.user.role === "SUPER_ADMIN"}
    />
  );
}
