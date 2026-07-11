"use client";

import { Select } from "antd";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import type { TeacherJournalGroup } from "@/features/journal/actions/journal-actions";
import { GroupStudentsTable } from "@/features/groups/ui/GroupStudentsTable";
import type { LevelOption } from "@/features/user-admin/lib/map-users-to-details";
import type { UserDetail } from "@/features/user-admin/ui/UserDetailModal";

type MyGroupViewProps = {
  groups: TeacherJournalGroup[];
  selectedGroupId: string;
  users: UserDetail[];
  levels: LevelOption[];
  subjectId: string;
};

export function MyGroupView({
  groups,
  selectedGroupId,
  users,
  levels,
  subjectId,
}: MyGroupViewProps) {
  const router = useRouter();

  const groupOptions = useMemo(
    () =>
      groups.map((group) => ({
        value: group.id,
        label: `${group.name} — ${group.subjectName}`,
      })),
    [groups],
  );

  const handleGroupChange = (nextGroupId: string) => {
    if (nextGroupId === selectedGroupId) return;
    router.push(`/my-group?groupId=${nextGroupId}`);
  };

  return (
    <GroupStudentsTable
      title="Моя группа"
      headerControls={
        <Select
          value={selectedGroupId}
          options={groupOptions}
          onChange={handleGroupChange}
          disabled={groups.length <= 1}
          className="min-w-[220px]"
          aria-label="Группа"
        />
      }
      users={users}
      groups={groups.map((group) => ({ id: group.id, name: group.name }))}
      levels={levels}
      groupId={selectedGroupId}
      subjectId={subjectId}
      readOnly
      canEditStatus
    />
  );
}
