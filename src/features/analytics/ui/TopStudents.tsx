"use client";

import { Table } from "antd";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { TopEntry } from "@/shared/lib/analytics";
import Title from "@/shared/ui/Title";

export function TopStudents({ data }: { data: TopEntry[] }) {
  return (
    <div className="flex flex-col gap-4">
      <Title level={4}>Топ учеников за месяц</Title>

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
        pagination={false}
        columns={[
          { title: "Ученик", dataIndex: ["student", "name"], key: "name" },
          { title: "Шагов", dataIndex: "stepsCompleted", key: "steps" },
          { title: "Ср. оценка", dataIndex: "avgGrade", key: "avg" },
          { title: "Прогулы", dataIndex: "absences", key: "absences" },
        ]}
      />
    </div>
  );
}
