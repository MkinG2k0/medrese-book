"use client";

import { Button, Modal, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { CreateGroupForm } from "@/features/groups/ui/CreateGroupForm";
import { EditGroupForm } from "@/features/groups/ui/EditGroupForm";
import Title from "@/shared/ui/Title";

type GroupRow = {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  studentCount: number;
};

type GroupsListProps = {
  groups: GroupRow[];
  teachers: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
};

export function GroupsList({ groups, teachers, subjects }: GroupsListProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [editGroup, setEditGroup] = useState<GroupRow | null>(null);
  const router = useRouter();

  const subjectFilters = useMemo(
    () =>
      [...subjects]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((subject) => ({ text: subject.name, value: subject.id })),
    [subjects],
  );

  const columns: ColumnsType<GroupRow> = useMemo(
    () => [
      {
        title: "Название",
        dataIndex: "name",
        key: "name",
        render: (name: string, record) => (
          <Link href={`/groups/${record.id}`} className="text-[#c9a84c]">
            {name}
          </Link>
        ),
      },
      {
        title: "Предмет",
        dataIndex: "subjectName",
        key: "subjectName",
        filters: subjectFilters,
        onFilter: (value, record) => record.subjectId === value,
      },
      { title: "Учитель", dataIndex: "teacherName", key: "teacherName" },
      {
        title: "Учеников",
        dataIndex: "studentCount",
        key: "studentCount",
        render: (count: number) => <Tag>{count}</Tag>,
      },
      {
        title: "Действия",
        key: "actions",
        render: (_: unknown, record: GroupRow) => (
          <Button size="small" onClick={() => setEditGroup(record)}>
            Редактировать
          </Button>
        ),
      },
    ],
    [subjectFilters],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Title level={3}>Группы</Title>
        <Button type="primary" onClick={() => setShowCreate(true)}>
          Создать группу
        </Button>
      </div>
      <Table dataSource={groups} rowKey="id" columns={columns} />

      <Modal
        title="Создать группу"
        open={showCreate}
        onCancel={() => setShowCreate(false)}
        footer={null}
        destroyOnHidden
      >
        <CreateGroupForm
          subjects={subjects}
          teachers={teachers}
          onSuccess={() => {
            setShowCreate(false);
            router.refresh();
          }}
        />
      </Modal>

      <Modal
        title="Редактировать группу"
        open={editGroup !== null}
        onCancel={() => setEditGroup(null)}
        footer={null}
        destroyOnHidden
      >
        {editGroup && (
          <EditGroupForm
            key={editGroup.id}
            groupId={editGroup.id}
            initialName={editGroup.name}
            initialTeacherId={editGroup.teacherId}
            subjectName={editGroup.subjectName}
            teachers={teachers}
            onSuccess={() => {
              setEditGroup(null);
              router.refresh();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
