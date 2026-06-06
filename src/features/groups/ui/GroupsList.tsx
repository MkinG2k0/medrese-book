"use client";

import { Table, Tag } from "antd";
import Link from "next/link";

import Title from "@/shared/ui/Title";

type GroupRow = {
  id: string;
  name: string;
  teacherName: string;
  studentCount: number;
};

export function GroupsList({ groups }: { groups: GroupRow[] }) {
  return (
    <div className="flex flex-col gap-4">
      <Title level={3}>Группы</Title>
      <Table
        dataSource={groups}
        rowKey="id"
        columns={[
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
          { title: "Учитель", dataIndex: "teacherName", key: "teacherName" },
          {
            title: "Учеников",
            dataIndex: "studentCount",
            key: "studentCount",
            render: (count: number) => <Tag>{count}</Tag>,
          },
        ]}
      />
    </div>
  );
}
