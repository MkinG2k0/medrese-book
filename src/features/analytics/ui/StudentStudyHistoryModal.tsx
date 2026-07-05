"use client";

import { Modal, Table, Tabs, Tag } from "antd";
import { useMemo } from "react";

import { useStudentExtraAssignmentHistory } from "@/entities/extra-assignment";
import {
  useStepCompletions,
  type StepCompletionRow,
} from "@/entities/step-completion/api/use-step-completions";
import { formatMinutesAsHours } from "@/shared/lib/format-minutes-as-hours";
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
  const { data: extraHistory = [], isLoading: isExtraLoading } =
    useStudentExtraAssignmentHistory(studentId ?? "");

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
      <Tabs
        items={[
          {
            key: "steps",
            label: "Шаги программы",
            children: (
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
                  {
                    title: "Длительность занятия",
                    key: "sessionDuration",
                    render: (_, record) => {
                      const minutes = record.session.sessionDurationMinutes;
                      return minutes != null
                        ? formatMinutesAsHours(minutes)
                        : "—";
                    },
                  },
                ]}
              />
            ),
          },
          {
            key: "extra",
            label: "Доп. задания",
            children: (
              <Table
                dataSource={extraHistory}
                rowKey="id"
                loading={isExtraLoading}
                pagination={{ pageSize: 10, showSizeChanger: false }}
                locale={{ emptyText: "Нет доп. заданий" }}
                columns={[
                  {
                    title: "Дата",
                    key: "date",
                    render: (_, record) => formatDate(record.session.date),
                  },
                  {
                    title: "Шаг",
                    key: "displayStep",
                    render: (_, record) =>
                      `Шаг ${record.displayStep.order}: ${record.displayStep.title}`,
                  },
                  {
                    title: "Задание",
                    dataIndex: ["template", "title"],
                    key: "title",
                  },
                  {
                    title: "Оценка",
                    key: "grade",
                    render: (_, record) =>
                      record.completion
                        ? (GRADE_LABEL[record.completion.grade] ??
                          record.completion.grade)
                        : "—",
                  },
                  {
                    title: "Автор",
                    key: "author",
                    render: (_, record) => record.template.author.name,
                  },
                ]}
              />
            ),
          },
        ]}
      />
    </Modal>
  );
}
