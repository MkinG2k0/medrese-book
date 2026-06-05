"use client";

import { DatePicker, Select } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";

import { useStudents } from "@/entities/student/api/use-students";
import { StepHistoryPage } from "@/features/journal/ui/StepHistoryPage";
import Text from "@/shared/ui/Text";
import Title from "@/shared/ui/Title";

type JournalHistoryPageProps = {
  groupId: string;
  levelNumber: number;
  levelTitle: string;
};

export function JournalHistoryPage({
  groupId,
  levelNumber,
  levelTitle,
}: JournalHistoryPageProps) {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const { data: students, isLoading } = useStudents(groupId);

  const sortedStudents = useMemo(
    () => [...(students ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [students],
  );

  useEffect(() => {
    if (!studentId && sortedStudents.length > 0) {
      setStudentId(sortedStudents[0]!.id);
    }
  }, [sortedStudents, studentId]);

  const selectedStudent = sortedStudents.find((s) => s.id === studentId);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Title level={3} className="!mb-0">
          История шагов
        </Title>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Select
            value={studentId ?? undefined}
            onChange={setStudentId}
            loading={isLoading}
            placeholder="Выберите ученика"
            className="w-full sm:min-w-[220px]"
            options={sortedStudents.map((student) => ({
              value: student.id,
              label: student.name,
            }))}
          />
          <DatePicker
            value={dateFilter ? dayjs(dateFilter) : null}
            onChange={(value) =>
              setDateFilter(value ? value.format("YYYY-MM-DD") : null)
            }
            allowClear
            placeholder="Все даты"
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {!isLoading && sortedStudents.length === 0 && (
        <Text type="secondary">В группе нет учеников</Text>
      )}

      {selectedStudent && (
        <StepHistoryPage
          key={`${selectedStudent.id}:${dateFilter ?? "all"}`}
          studentId={selectedStudent.id}
          studentName={selectedStudent.name}
          currentStepIdx={selectedStudent.currentStepIdx}
          levelNumber={levelNumber}
          levelTitle={levelTitle}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          showDateFilter={false}
        />
      )}
    </div>
  );
}
