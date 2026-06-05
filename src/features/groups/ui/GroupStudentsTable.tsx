"use client";

import { Table, Tag } from "antd";

type StudentRow = {
  id: string;
  name: string;
  currentStepIdx: number;
};

export function GroupStudentsTable({ students }: { students: StudentRow[] }) {
  return (
    <Table
      dataSource={students}
      rowKey="id"
      columns={[
        { title: "Ученик", dataIndex: "name", key: "name" },
        {
          title: "Текущий шаг",
          dataIndex: "currentStepIdx",
          key: "currentStepIdx",
          render: (idx: number) => <Tag>{idx + 1}</Tag>,
        },
      ]}
    />
  );
}
