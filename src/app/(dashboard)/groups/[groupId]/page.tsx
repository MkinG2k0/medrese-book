import { notFound } from "next/navigation";

import { getGroup } from "@/features/groups/actions/group-actions";
import { getLevelsForCreateUser } from "@/features/user-admin/actions/user-actions";
import { mapUsersToDetails } from "@/features/user-admin/lib/map-users-to-details";
import { UsersTable } from "@/features/user-admin/ui/UsersTable";
import { prisma } from "@/shared/lib/prisma";
import { requireRoles } from "@/shared/lib/session";
import Text from "@/shared/ui/Text";

type Props = { params: Promise<{ groupId: string }> };

export default async function GroupDetailPage({ params }: Props) {
  const session = await requireRoles(["TEACHER", "MANAGER", "SUPER_ADMIN"]);
  const { groupId } = await params;
  const { group } = await getGroup(groupId);

  if (!group) notFound();

  const canManageUsers =
    session.user.role === "SUPER_ADMIN" || session.user.role === "MANAGER";

  const [groups, levels] = await Promise.all([
    prisma.group.findMany({ select: { id: true, name: true } }),
    canManageUsers ? getLevelsForCreateUser() : Promise.resolve([]),
  ]);

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

  const rows = mapUsersToDetails(studentUsers, levelOptions);

  return (
    <div className="flex flex-col gap-4">
      <Text type="secondary">Учитель: {group.teacher.user.name}</Text>

      <UsersTable
        users={rows}
        groups={groups}
        levels={levelOptions}
        canResetCode={session.user.role === "SUPER_ADMIN"}
        title={group.name}
        showCreateButton={false}
        hideRoleColumn
        hideGroupColumn
        enableRowClick={canManageUsers}
      />
    </div>
  );
}
