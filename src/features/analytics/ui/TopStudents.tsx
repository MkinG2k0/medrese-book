"use client";

import { Table } from "antd";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { StudentStudyHistoryModal } from "@/features/analytics/ui/StudentStudyHistoryModal";
import type { TopEntry } from "@/shared/lib/analytics";
import { formatMinutesAsHours } from "@/shared/lib/format-minutes-as-hours";
import Title from "@/shared/ui/Title";

export function TopStudents({
  data,
  monthLabel,
  subjectId,
}: {
  data: TopEntry[];
  monthLabel: string;
  subjectId: string;
}) {
  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    name: string;
  } | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <Title level={4}>Топ учеников за {monthLabel}</Title>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.slice(0, 5)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2622" />
            <XAxis dataKey="student.name" stroke="#8a8375" />
            <YAxis stroke="#8a8375" />
            <Tooltip />
            <Bar dataKey="stepsCompleted" fill="#c9a84c" name="Шагов" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <Table
        dataSource={data}
        rowKey={(r) => r.student.id}
        pagination={{ pageSize: 10, showSizeChanger: false }}
        onRow={(record) => ({
          onClick: () =>
            setSelectedStudent({
              id: record.student.id,
              name: record.student.name,
            }),
          className: "cursor-pointer",
        })}
        columns={[
          {
            title: "Ученик",
            dataIndex: ["student", "name"],
            key: "name",
          },
          { title: "Шагов", dataIndex: "stepsCompleted", key: "steps" },
          { title: "Ср. оценка", dataIndex: "avgGrade", key: "avg" },
          {
            title: "Посещено",
            dataIndex: "attendedSessions",
            key: "attended",
          },
          { title: "Прогулы", dataIndex: "absences", key: "absences" },
          {
            title: "Опоздания",
            dataIndex: "lateMinutes",
            key: "lateness",
            render: (minutes: number) => formatMinutesAsHours(minutes),
          },
        ]}
      />

      <StudentStudyHistoryModal
        open={selectedStudent !== null}
        studentId={selectedStudent?.id ?? null}
        studentName={selectedStudent?.name ?? ""}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
}
