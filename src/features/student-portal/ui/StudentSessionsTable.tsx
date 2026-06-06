"use client";

import { Table, Tag } from "antd";

import { formatDate } from "@/shared/lib/utils";

type SessionRow = {
  id: string;
  date: Date | string;
  attendance: string;
  completions: { grade: number }[];
};

export function StudentSessionsTable({ sessions }: { sessions: SessionRow[] }) {
  return (
    <Table
      dataSource={sessions}
      rowKey="id"
      pagination={{ pageSize: 10 }}
      columns={[
        {
          title: "Дата",
          dataIndex: "date",
          key: "date",
          render: (d: Date | string) => formatDate(d),
        },
        {
          title: "Посещаемость",
          dataIndex: "attendance",
          key: "attendance",
          render: (a: string) => <Tag>{a}</Tag>,
        },
        {
          title: "Оценки",
          key: "grades",
          render: (_, record) =>
            record.completions.map((c) => c.grade).join(", ") || "—",
        },
      ]}
    />
  );
}
