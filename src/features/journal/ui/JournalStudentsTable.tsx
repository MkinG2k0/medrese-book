"use client";

import { Table, Tag } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";

type JournalStudentRow = {
  id: string;
  name: string;
  currentStepIdx: number;
  hasSessionToday?: boolean;
  todayAttendance?: "PRESENT" | "LATE" | "ABSENT" | null;
  todayStepsCompleted?: number;
  todayGrades?: number[];
};

const ATTENDANCE_LABELS: Record<
  "PRESENT" | "LATE" | "ABSENT",
  { label: string; color: string }
> = {
  PRESENT: { label: "Пришёл", color: "green" },
  LATE: { label: "Опоздал", color: "orange" },
  ABSENT: { label: "Прогул", color: "red" },
};

function AttendanceCell({
  attendance,
}: {
  attendance?: "PRESENT" | "LATE" | "ABSENT" | null;
}) {
  if (!attendance) {
    return <Tag>Не отмечен</Tag>;
  }

  const { label, color } = ATTENDANCE_LABELS[attendance];
  return <Tag color={color}>{label}</Tag>;
}

export function JournalStudentsTable({
  students,
}: {
  students: JournalStudentRow[];
}) {
  const router = useRouter();

  return (
    <Table
      dataSource={students}
      rowKey="id"
      pagination={false}
      onRow={(record) => ({
        onClick: () => router.push(`/journal/${record.id}`),
        className: "cursor-pointer",
      })}
      columns={[
        {
          title: "Ученик",
          dataIndex: "name",
          key: "name",
          render: (name: string, record) => (
            <Link href={`/journal/${record.id}`} onClick={(e) => e.stopPropagation()}>
              {name}
            </Link>
          ),
        },
        {
          title: "Посещаемость",
          key: "attendance",
          render: (_, record) => (
            <AttendanceCell attendance={record.todayAttendance} />
          ),
        },
        {
          title: "Текущий шаг",
          dataIndex: "currentStepIdx",
          key: "currentStepIdx",
          render: (idx: number) => <Tag>Шаг {idx + 1}</Tag>,
        },
        {
          title: "Пройдено сегодня",
          dataIndex: "todayStepsCompleted",
          key: "todayStepsCompleted",
          render: (count: number | undefined) => count ?? 0,
        },
        {
          title: "Оценки",
          key: "grades",
          render: (_, record) =>
            record.todayGrades?.length
              ? record.todayGrades.join(", ")
              : "—",
        },
      ]}
    />
  );
}
