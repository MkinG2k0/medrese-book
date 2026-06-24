"use client";

import { Modal, Table, Tag } from "antd";
import { useMemo } from "react";

import {
  useStepCompletions,
  type StepCompletionRow,
} from "@/entities/step-completion/api/use-step-completions";
import { formatDate } from "@/shared/lib/utils";
import Text from "@/shared/ui/Text";

const GRADE_LABEL: Record<number, string> = {
  1: "Средне",
  3: "Хорошо",
  5: "Отлично",
};

const ATTENDANCE_LABEL: Record<
  "PRESENT" | "LATE" | "ABSENT",
  { label: string; color: string }
> = {
  PRESENT: { label: "Пришёл", color: "green" },
  LATE: { label: "Опоздал", color: "orange" },
  ABSENT: { label: "Прогул", color: "red" },
};

type StudentStudyHistoryModalProps = {
  open: boolean;
  studentId: string | null;
  studentName: string;
  onClose: () => void;
};

export function StudentStudyHistoryModal({
  open,
  studentId,
  studentName,
  onClose,
}: StudentStudyHistoryModalProps) {
  const { data: completions, isLoading } = useStepCompletions(
    studentId ?? "",
    null,
  );

  const sortedCompletions = useMemo(
    () =>
      [...(completions ?? [])].sort(
        (a, b) =>
          b.session.date.localeCompare(a.session.date) ||
          a.step.order - b.step.order,
      ),
    [completions],
  );

  return (
    <Modal
      title={`История учёбы — ${studentName}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnHidden
    >
      <Table<StepCompletionRow>
        dataSource={sortedCompletions}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        locale={{ emptyText: "Нет пройденных шагов" }}
        columns={[
          {
            title: "Шаг",
            key: "step",
            render: (_, record) => (
              <div className="flex flex-col gap-1">
                <Text strong>Шаг {record.step.order}</Text>
                <Text type="secondary">{record.step.title}</Text>
              </div>
            ),
          },
          {
            title: "Оценка",
            dataIndex: "grade",
            key: "grade",
            render: (grade: number) => GRADE_LABEL[grade] ?? grade,
          },
          {
            title: "Заметка",
            dataIndex: "note",
            key: "note",
            render: (note: string | null) => note || "—",
          },
          {
            title: "Дата занятия",
            key: "sessionDate",
            render: (_, record) => formatDate(record.session.date),
          },
          {
            title: "Посещаемость",
            key: "attendance",
            render: (_, record) => {
              const { label, color } =
                ATTENDANCE_LABEL[record.session.attendance];
              return <Tag color={color}>{label}</Tag>;
            },
          },
        ]}
      />
    </Modal>
  );
}
