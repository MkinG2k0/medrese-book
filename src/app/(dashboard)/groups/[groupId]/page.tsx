import { notFound } from "next/navigation";

import { getGroup } from "@/features/groups/actions/group-actions";
import { GroupStudentsTable } from "@/features/groups/ui/GroupStudentsTable";
import { canEditGroup } from "@/shared/lib/group-access";
import { requireRoles } from "@/shared/lib/session";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";

type Props = { params: Promise<{ groupId: string }> };

export default async function GroupDetailPage({ params }: Props) {
  await requireRoles(["TEACHER", "MANAGER", "SUPER_ADMIN"]);
  const { groupId } = await params;
  const { group, session } = await getGroup(groupId);

  if (!group) notFound();

  const editable = canEditGroup(
    session.user.role,
    session.user.teacherId,
    group.teacherId,
  );

  return (
    <div className="flex flex-col gap-4">
      <Title level={3}>{group.name}</Title>
      <Text type="secondary">
        Учитель: {group.teacher.user.name}
        {!editable && " · Только просмотр"}
      </Text>

      <GroupStudentsTable
        students={group.students.map((s) => ({
          id: s.id,
          name: s.user.name,
          levelTitle: s.level.title,
          currentStepIdx: s.currentStepIdx,
        }))}
      />
    </div>
  );
}
