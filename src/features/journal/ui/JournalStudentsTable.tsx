"use client";

import { Table, Tag } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Text from "@/shared/ui/Text";

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
  blocked = false,
}: {
  students: JournalStudentRow[];
  blocked?: boolean;
}) {
  const router = useRouter();

  return (
    <div className="relative">
      {blocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-[#12100e]/80 p-6">
          <Text type="secondary" className="max-w-md text-center">
            Сначала нажмите «Начать урок», чтобы открыть список учеников
          </Text>
        </div>
      )}

      <Table
        dataSource={students}
        rowKey="id"
        pagination={false}
        className={blocked ? "pointer-events-none opacity-50" : undefined}
        onRow={(record) => ({
          onClick: blocked
            ? undefined
            : () => router.push(`/journal/${record.id}`),
          className: blocked ? undefined : "cursor-pointer",
        })}
        columns={[
          {
            title: "Ученик",
            dataIndex: "name",
            key: "name",
            render: (name: string, record) =>
              blocked ? (
                <span>{name}</span>
              ) : (
                <Link
                  href={`/journal/${record.id}`}
                  onClick={(e) => e.stopPropagation()}
                >
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
    </div>
  );
}
