"use client";

import { Table } from "antd";
import { useMemo, useState } from "react";

import { JournalRiskBadge } from "@/features/journal/ui/JournalRiskBadge";
import {
  RiskSignalsColumnTitle,
  RiskSignalsHelpTrigger,
} from "@/features/journal/ui/RiskSignalsHelpModal";
import { StudentStudyHistoryModal } from "@/features/analytics/ui/StudentStudyHistoryModal";
import { formatMinutesAsHours } from "@/shared/lib/format-minutes-as-hours";
import type { AtRiskStudentRow } from "@/shared/lib/student-metrics/types";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";

type AtRiskStudentsTableProps = {
  data: AtRiskStudentRow[];
  monthLabel: string;
  showTeacherColumn: boolean;
  subjectId: string;
};

export function AtRiskStudentsTable({
  data,
  monthLabel,
  showTeacherColumn,
  subjectId,
}: AtRiskStudentsTableProps) {
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const columns = useMemo(() => {
    const base = [
      {
        title: "Ученик",
        key: "student",
        render: (_: unknown, record: AtRiskStudentRow) => record.student.name,
      },
      ...(showTeacherColumn
        ? [
            {
              title: "Преподаватель",
              dataIndex: "teacherName" as const,
              key: "teacher",
            },
          ]
        : []),
      {
        title: "Уровень",
        dataIndex: "levelTitle",
        key: "level",
      },
      {
        title: <RiskSignalsColumnTitle />,
        key: "signals",
        render: (_: unknown, record: AtRiskStudentRow) => (
          <JournalRiskBadge
            riskFlags={record.riskFlags}
            studentName={record.student.name}
          />
        ),
      },
      {
        title: "Пропуски",
        dataIndex: "absencesInMonth",
        key: "absences",
      },
      {
        title: "Время",
        key: "time",
        render: (_: unknown, record: AtRiskStudentRow) =>
          formatMinutesAsHours(record.actualMinutes),
      },
      {
        title: "Норматив",
        key: "norm",
        render: (_: unknown, record: AtRiskStudentRow) =>
          formatMinutesAsHours(record.budgetMinutes),
      },
    ];

    return base;
  }, [showTeacherColumn]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1">
        <Title level={4} className="!mb-0">
          Требуют внимания
        </Title>
        <RiskSignalsHelpTrigger ariaLabel="Подробнее о блоке «Требуют внимания»" />
      </div>
      <Text type="secondary">За {monthLabel}</Text>

      <Table
        dataSource={data}
        rowKey={(record) => record.student.id}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        locale={{
          emptyText: `Все ученики в норме за ${monthLabel}`,
        }}
        onRow={(record) => ({
          onClick: () =>
            setSelectedStudent({
              id: record.student.id,
              name: record.student.name,
            }),
          className: "cursor-pointer",
        })}
        columns={columns}
      />

      <StudentStudyHistoryModal
        open={selectedStudent !== null}
        studentId={selectedStudent?.id ?? null}
        studentName={selectedStudent?.name ?? ""}
        subjectId={subjectId}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
}
