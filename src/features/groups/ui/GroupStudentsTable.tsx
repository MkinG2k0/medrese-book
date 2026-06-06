"use client";

import { Button, Table, Tag } from "antd";
import Link from "next/link";

type StudentRow = {
  id: string;
  name: string;
  levelTitle: string;
  currentStepIdx: number;
};

export function GroupStudentsTable({
  students,
  editable = true,
}: {
  students: StudentRow[];
  editable?: boolean;
}) {
  return (
    <Table
      dataSource={students}
      rowKey="id"
      columns={[
        { title: "Ученик", dataIndex: "name", key: "name" },
        { title: "Уровень", dataIndex: "levelTitle", key: "levelTitle" },
        {
          title: "Текущий шаг",
          dataIndex: "currentStepIdx",
          key: "currentStepIdx",
          render: (idx: number) => <Tag>Шаг {idx + 1}</Tag>,
        },
        ...(editable
          ? [
              {
                title: "Действия",
                key: "actions",
                render: (_: unknown, record: StudentRow) => (
                  <Link href={`/students/${record.id}/edit`}>
                    <Button size="small">Прогресс</Button>
                  </Link>
                ),
              },
            ]
          : []),
      ]}
    />
  );
}
