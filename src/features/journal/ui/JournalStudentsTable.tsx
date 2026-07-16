"use client";

import { Modal, Table, Tag } from "antd";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { resumeStudentFromPause } from "@/features/journal/actions/journal-actions";
import { buildJournalHref } from "@/features/journal/lib/journal-url";
import { JournalRiskBadge } from "@/features/journal/ui/JournalRiskBadge";
import { RiskSignalsColumnTitle } from "@/features/journal/ui/RiskSignalsHelpModal";
import type { RiskFlag } from "@/shared/lib/student-metrics/types";
import type { StudentStatus } from "@/shared/lib/student-status";
import Text from "@/shared/ui/Text";

type JournalStudentRow = {
  id: string;
  name: string;
  status: StudentStatus;
  currentStepIdx: number;
  hasSessionToday?: boolean;
  todayAttendance?: "PRESENT" | "LATE" | "ABSENT" | null;
  todayStepsCompleted?: number;
  todayGrades?: number[];
  riskFlags?: RiskFlag[];
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

function StudentNameCell({
  name,
  status,
  studentId,
  blocked,
  journalDate,
  journalGroupId,
}: {
  name: string;
  status: StudentStatus;
  studentId: string;
  blocked: boolean;
  journalDate: string;
  journalGroupId: string;
}) {
  if (blocked) {
    return <span>{name}</span>;
  }

  if (status === "PAUSE") {
    return <Text type="warning">{name}</Text>;
  }

  const href = buildJournalHref(
    `/journal/${studentId}`,
    journalDate,
    journalGroupId,
  );

  return (
    <Link href={href} onClick={(e) => e.stopPropagation()}>
      {name}
    </Link>
  );
}

export function JournalStudentsTable({
  students,
  blocked = false,
  showRiskBadge = false,
  journalDate,
  journalGroupId,
}: {
  students: JournalStudentRow[];
  blocked?: boolean;
  showRiskBadge?: boolean;
  journalDate: string;
  journalGroupId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const openLesson = (studentId: string) => {
    router.push(
      buildJournalHref(`/journal/${studentId}`, journalDate, journalGroupId),
    );
  };

  const handlePausedStudentClick = (record: JournalStudentRow) => {
    Modal.confirm({
      title: "Вывести ученика из паузы?",
      content: `${record.name} сейчас на паузе. Открыть урок?`,
      okText: "Да",
      cancelText: "Нет",
      onOk: async () => {
        await resumeStudentFromPause(record.id, journalGroupId);
        await queryClient.invalidateQueries({ queryKey: ["students"] });
        openLesson(record.id);
      },
    });
  };

  const handleRowClick = (record: JournalStudentRow) => {
    if (record.status === "PAUSE") {
      handlePausedStudentClick(record);
      return;
    }

    openLesson(record.id);
  };

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
        scroll={{ x: "max-content" }}
        className={blocked ? "pointer-events-none opacity-50" : undefined}
        onRow={(record) => ({
          onClick: blocked ? undefined : () => handleRowClick(record),
          className: blocked ? undefined : "cursor-pointer",
        })}
        columns={[
          {
            title: "Ученик",
            dataIndex: "name",
            key: "name",
            render: (name: string, record) => (
              <StudentNameCell
                name={name}
                status={record.status}
                studentId={record.id}
                blocked={blocked}
                journalDate={journalDate}
                journalGroupId={journalGroupId}
              />
            ),
          },
          ...(showRiskBadge
            ? [
                {
                  title: <RiskSignalsColumnTitle />,
                  key: "riskFlags",
                  width: 140,
                  responsive: ["md" as const],
                  render: (_: unknown, record: JournalStudentRow) =>
                    record.riskFlags && record.riskFlags.length > 0 ? (
                      <JournalRiskBadge
                        riskFlags={record.riskFlags}
                        studentName={record.name}
                      />
                    ) : (
                      "—"
                    ),
                },
              ]
            : []),
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
            responsive: ["md" as const],
            render: (count: number | undefined) => count ?? 0,
          },
          {
            title: "Оценки",
            key: "grades",
            responsive: ["md" as const],
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
