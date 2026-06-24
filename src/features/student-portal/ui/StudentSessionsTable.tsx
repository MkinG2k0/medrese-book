"use client";

import { Table, Tag } from "antd";

import { formatDate } from "@/shared/lib/utils";

type SessionRow = {
  id: string;
  date: Date | string;
  attendance: string;
  completions: { grade: number; step: { title: string } }[];
};

const ATTENDANCE_LABELS: Record<string, { label: string; color: string }> = {
  PRESENT: { label: "Пришёл", color: "green" },
  LATE: { label: "Опоздал", color: "orange" },
  ABSENT: { label: "Не пришёл", color: "red" },
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
          render: (a: string) => {
            const info = ATTENDANCE_LABELS[a] ?? { label: a, color: "default" };
            return <Tag color={info.color}>{info.label}</Tag>;
          },
        },
        {
          title: "Оценки",
          key: "grades",
          render: (_, record) =>
            record.completions.length === 0 ? (
              "—"
            ) : (
              <div className="flex flex-col gap-1">
                {record.completions.map((c, i) => (
                  <span key={i}>
                    {c.step.title}: <strong>{c.grade}</strong>
                  </span>
                ))}
              </div>
            ),
        },
      ]}
    />
  );
}
