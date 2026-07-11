"use client";

import { Collapse, Empty, Spin, Table } from "antd";
import { useMemo } from "react";

import { useStudentExtraAssignmentHistory } from "@/entities/extra-assignment";
import type { ExtraAssignmentHistoryRow } from "@/entities/extra-assignment/model/types";
import { formatDate } from "@/shared/lib/utils";
import Title from "@/shared/ui/Title";

const GRADE_LABELS: Record<number, string> = {
  1: "Средне",
  3: "Хорошо",
  5: "Отлично",
};

function groupBySubject(rows: ExtraAssignmentHistoryRow[]) {
  const groups = new Map<
    string,
    { subjectName: string; rows: ExtraAssignmentHistoryRow[] }
  >();

  for (const row of rows) {
    const existing = groups.get(row.subject.id);
    if (existing) {
      existing.rows.push(row);
      continue;
    }
    groups.set(row.subject.id, {
      subjectName: row.subject.name,
      rows: [row],
    });
  }

  return [...groups.values()].sort((a, b) =>
    a.subjectName.localeCompare(b.subjectName, "ru"),
  );
}

export function StudentExtraAssignmentsHistory() {
  const { data: history = [], isLoading } = useStudentExtraAssignmentHistory();
  const grouped = useMemo(() => groupBySubject(history), [history]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spin />
      </div>
    );
  }

  if (grouped.length === 0) {
    return <Empty description="Пока нет доп. заданий" />;
  }

  return (
    <Collapse
      defaultActiveKey={grouped.map((group) => group.subjectName)}
      items={grouped.map((group) => ({
        key: group.subjectName,
        label: <Title level={4}>{group.subjectName}</Title>,
        children: (
          <Table
            dataSource={group.rows}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            columns={[
              {
                title: "Дата занятия",
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
                title: "Автор",
                key: "author",
                render: (_, record) => record.template.author.name,
              },
              {
                title: "Оценка",
                key: "grade",
                render: (_, record) =>
                  record.completion
                    ? (GRADE_LABELS[record.completion.grade] ??
                      record.completion.grade)
                    : "—",
              },
            ]}
          />
        ),
      }))}
    />
  );
}
