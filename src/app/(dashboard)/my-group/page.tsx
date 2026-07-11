import { notFound } from "next/navigation";

import { getMyGroupById } from "@/features/groups/actions/group-actions";
import { MyGroupView } from "@/features/groups/ui/MyGroupView";
import { getTeacherGroups } from "@/features/journal/actions/journal-actions";
import { getLevelsForStudentProfile } from "@/features/user-admin/actions/user-actions";
import { mapUsersToDetails } from "@/features/user-admin/lib/map-users-to-details";
import { requireRole } from "@/shared/lib/session";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";

type MyGroupPageProps = {
  searchParams: Promise<{ groupId?: string }>;
};

export default async function MyGroupPage({ searchParams }: MyGroupPageProps) {
  await requireRole("TEACHER");
  const { groupId: groupIdParam } = await searchParams;

  const [groups, allLevels] = await Promise.all([
    getTeacherGroups(),
    getLevelsForStudentProfile(),
  ]);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <Title level={3}>Моя группа</Title>
        <Text type="secondary">Группа не назначена</Text>
      </div>
    );
  }

  const defaultGroupId = groups[0]!.id;
  const selectedGroupId =
    groupIdParam && groups.some((group) => group.id === groupIdParam)
      ? groupIdParam
      : defaultGroupId;

  const group = await getMyGroupById(selectedGroupId);
  if (!group) notFound();

  const levels = allLevels.filter((level) => level.subjectId === group.subjectId);

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
          currentStepIdx: enrollment.currentStepIdx,
          level: enrollment.level,
          group: { name: group.name },
        },
      ],
    },
  }));

  const users = mapUsersToDetails(studentUsers, levelOptions);

  return (
    <MyGroupView
      groups={groups}
      selectedGroupId={selectedGroupId}
      users={users}
      levels={levelOptions}
      subjectId={group.subjectId}
    />
  );
}
