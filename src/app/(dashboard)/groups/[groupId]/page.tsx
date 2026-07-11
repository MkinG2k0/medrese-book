import { notFound } from "next/navigation";

import { getGroup } from "@/features/groups/actions/group-actions";
import { GroupStudentsTable } from "@/features/groups/ui/GroupStudentsTable";
import { mapUsersToDetails } from "@/features/user-admin/lib/map-users-to-details";
import { prisma } from "@/shared/lib/prisma";
import { requireRoles } from "@/shared/lib/session";

type Props = { params: Promise<{ groupId: string }> };

export default async function GroupDetailPage({ params }: Props) {
  const session = await requireRoles(["MANAGER", "SUPER_ADMIN"]);
  const { groupId } = await params;
  const [groups, { group }] = await Promise.all([
    prisma.group.findMany({ select: { id: true, name: true } }),
    getGroup(groupId),
  ]);

  if (!group) notFound();

  const levels = await prisma.level.findMany({
    where: { subjectId: group.subjectId },
    include: { steps: { orderBy: { order: "asc" } } },
    orderBy: { number: "asc" },
  });

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

  const studentUsers = group.enrollments.map((enrollment) => ({
    ...enrollment.student.user,
    student: {
      ...enrollment.student,
      enrollments: [
        {
          levelId: enrollment.levelId,
          groupId: group.id,
          level: enrollment.level,
          group: { name: group.name },
        },
      ],
    },
  }));

  const users = mapUsersToDetails(studentUsers, levelOptions);

  return (
    <GroupStudentsTable
      title={group.name}
      subtitle={`Учитель: ${group.teacher.user.name} · Предмет: ${group.subject.name}`}
      users={users}
      groups={groups}
      levels={levelOptions}
      groupId={group.id}
      subjectId={group.subjectId}
      canManageEnrollment
      canResetCode={session.user.role === "SUPER_ADMIN"}
    />
  );
}
