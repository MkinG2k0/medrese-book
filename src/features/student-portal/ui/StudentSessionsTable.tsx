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

const GRADE_LABELS: Record<number, string> = {
  1: "Средне",
  3: "Хорошо",
  5: "Отлично",
};

type GradeRow = {
  key: string;
  date: Date | string;
  attendance: string;
  topic: string | null;
  grade: number | null;
};

function buildGradeRows(sessions: SessionRow[]): GradeRow[] {
  return sessions.flatMap((session) => {
    if (session.completions.length === 0) {
      return [
        {
          key: session.id,
          date: session.date,
          attendance: session.attendance,
          topic: null,
          grade: null,
        },
      ];
    }

    return session.completions.map((completion, index) => ({
      key: `${session.id}-${index}`,
      date: session.date,
      attendance: session.attendance,
      topic: completion.step.title,
      grade: completion.grade,
    }));
  });
}

export function StudentSessionsTable({ sessions }: { sessions: SessionRow[] }) {
  const rows = buildGradeRows(sessions);

  return (
    <Table
      dataSource={rows}
      rowKey="key"
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
          title: "Тема",
          dataIndex: "topic",
          key: "topic",
          render: (topic: string | null) => topic ?? "—",
        },
        {
          title: "Оценка",
          dataIndex: "grade",
          key: "grade",
          render: (grade: number | null) =>
            grade != null ? (GRADE_LABELS[grade] ?? grade) : "—",
        },
      ]}
    />
  );
}
