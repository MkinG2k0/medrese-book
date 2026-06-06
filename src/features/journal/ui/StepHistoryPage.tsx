"use client";

import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { Button, DatePicker, Input, Modal, Radio, Table, Tag, message } from "antd";
import dayjs from "dayjs";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  useDeleteStepCompletions,
  useStepCompletions,
  useUpdateStepCompletion,
  type StepCompletionRow,
} from "@/entities/step-completion/api/use-step-completions";
import { formatDate } from "@/shared/lib/utils";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";

const GRADE_OPTIONS = [
  { label: "Средне", value: 1 },
  { label: "Хорошо", value: 3 },
  { label: "Отлично", value: 5 },
] as const;

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

type StepHistoryPageProps = {
  studentId: string;
  studentName: string;
  currentStepIdx: number;
  levelNumber: number;
  levelTitle: string;
  backHref?: string;
  backLabel?: string;
  dateFilter?: string | null;
  onDateFilterChange?: (date: string | null) => void;
  showDateFilter?: boolean;
};

export function StepHistoryPage({
  studentId,
  studentName,
  currentStepIdx,
  levelNumber,
  levelTitle,
  backHref,
  backLabel,
  dateFilter: dateFilterProp,
  onDateFilterChange,
  showDateFilter = true,
}: StepHistoryPageProps) {
  const [internalDateFilter, setInternalDateFilter] = useState<string | null>(
    null,
  );
  const isControlled = onDateFilterChange !== undefined;
  const dateFilter = isControlled
    ? (dateFilterProp ?? null)
    : internalDateFilter;
  const setDateFilter = isControlled
    ? onDateFilterChange
    : setInternalDateFilter;
  const { data: completions, isLoading } = useStepCompletions(
    studentId,
    dateFilter,
  );
  const updateCompletion = useUpdateStepCompletion(studentId);
  const deleteCompletions = useDeleteStepCompletions(studentId);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<StepCompletionRow | null>(null);
  const [editGrade, setEditGrade] = useState<number | null>(null);
  const [editNote, setEditNote] = useState("");

  const sortedCompletions = useMemo(
    () =>
      [...(completions ?? [])].sort(
        (a, b) =>
          a.step.order - b.step.order ||
          b.createdAt.localeCompare(a.createdAt),
      ),
    [completions],
  );

  const openEdit = (record: StepCompletionRow) => {
    setEditing(record);
    setEditGrade(record.grade);
    setEditNote(record.note ?? "");
  };

  const closeEdit = () => {
    setEditing(null);
    setEditGrade(null);
    setEditNote("");
  };

  const handleSaveEdit = async () => {
    if (!editing || editGrade === null) return;

    try {
      await updateCompletion.mutateAsync({
        id: editing.id,
        grade: editGrade,
        note: editNote || null,
      });
      message.success("Запись обновлена");
      closeEdit();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Ошибка сохранения");
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;

    Modal.confirm({
      title: `Удалить ${selectedIds.length} записей?`,
      content: "Прогресс ученика будет пересчитан.",
      okText: "Удалить",
      okType: "danger",
      cancelText: "Отмена",
      onOk: async () => {
        try {
          await deleteCompletions.mutateAsync(selectedIds);
          message.success("Записи удалены");
          setSelectedIds([]);
        } catch (err) {
          message.error(err instanceof Error ? err.message : "Ошибка удаления");
        }
      },
    });
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-8">
      {backHref && (
        <Link href={backHref} className="flex items-center gap-2 no-underline">
          <ArrowLeftOutlined />
          <Text>{backLabel ?? "Назад"}</Text>
        </Link>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          {!isControlled && (
            <Title level={3} className="!mb-0">
              История шагов — {studentName}
            </Title>
          )}
          {isControlled ? (
            <Text type="secondary">
              {studentName} · Уровень {levelNumber} · {levelTitle} · Текущий
              шаг {currentStepIdx + 1}
            </Text>
          ) : (
            <Text type="secondary">
              Уровень {levelNumber} · {levelTitle} · Текущий шаг{" "}
              {currentStepIdx + 1}
            </Text>
          )}
        </div>
        {showDateFilter && (
          <DatePicker
            value={dateFilter ? dayjs(dateFilter) : null}
            onChange={(value) =>
              setDateFilter(value ? value.format("YYYY-MM-DD") : null)
            }
            allowClear
            placeholder="Все даты"
            className="w-full sm:w-auto"
          />
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3">
          <Text>Выбрано: {selectedIds.length}</Text>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleBulkDelete}
            loading={deleteCompletions.isPending}
          >
            Удалить выбранные
          </Button>
        </div>
      )}

      <Table
        dataSource={sortedCompletions}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys as string[]),
        }}
        locale={{
          emptyText: dateFilter
            ? "Нет шагов за выбранную дату"
            : "Нет пройденных шагов",
        }}
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
            title: "",
            key: "actions",
            width: 56,
            render: (_, record) => (
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => openEdit(record)}
                aria-label="Редактировать"
              />
            ),
          },
        ]}
      />

      <Modal
        title={
          editing
            ? `Редактировать — шаг ${editing.step.order}: ${editing.step.title}`
            : "Редактировать"
        }
        open={!!editing}
        onCancel={closeEdit}
        onOk={handleSaveEdit}
        okText="Сохранить"
        cancelText="Отмена"
        confirmLoading={updateCompletion.isPending}
      >
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-2">
            <Text type="secondary" className="uppercase">
              Оценка
            </Text>
            <Radio.Group
              value={editGrade}
              onChange={(e) => setEditGrade(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            >
              {GRADE_OPTIONS.map((opt) => (
                <Radio.Button key={opt.value} value={opt.value}>
                  {opt.label}
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>
          <div className="flex flex-col gap-2">
            <Text type="secondary" className="uppercase">
              Заметка
            </Text>
            <Input.TextArea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              rows={3}
              placeholder="Заметка учителя..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
